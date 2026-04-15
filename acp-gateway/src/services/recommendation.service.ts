import fs from 'fs';
import path from 'path';
import vm from 'vm';
import type { HealthReport, ReportIndicator } from './report.model';
import { buildPantryQueryResult, type PantryQueryResult } from './pantry-recipe.service';
import { buildProfileFromReport } from './report-profile.service';
import { SPECIAL_FINDING_LIBRARY, type SpecialFindingRule } from './report-special-findings-library';
import { reportService } from './report.service';
import { getEffectiveHealthProfile, mergeHealthProfiles, type HealthProfile } from './user-profile.store';

type ContentType = 'recipe' | 'exercise' | 'psychology' | 'sleep';
type ExerciseIntensity = 'low' | 'medium' | 'high';

export interface Content {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  time?: string;
  calories?: number; // kcal
  duration?: number; // seconds for short clips; minutes for legacy long-form content
  durationSeconds?: number;
  tags: string[];
  evidenceBadges?: string[];
  reason?: string;
  url?: string;
  imageUrl?: string;
  // exercise video fields (optional)
  bvid?: string;
  posterUrl?: string;
  intensity?: ExerciseIntensity;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  tags?: string[];
}

export interface Page {
  name: string;
  url: string;
}

export interface RecommendationOptions {
  userId?: string;
  message?: string;
  profile?: HealthProfile | null;
  report?: HealthReport | null;
}

type ContentCatalogItem = Omit<Content, 'reason'>;
type RecipeCatalogItem = ContentCatalogItem & { type: 'recipe' };
type ExerciseCatalogItem = ContentCatalogItem & { type: 'exercise' };

type RecommendationSignals = {
  topics: Set<string>;
  topicEvidence: Map<string, Set<string>>;
  topicWeights: Map<string, number>;
  exerciseMaxIntensity: ExerciseIntensity;
  reportId?: string;
  pantryQuery: PantryQueryResult | null;
  hasProfile: boolean;
};

type RankedContentCandidate = {
  content: Omit<Content, 'reason'>;
  score: number;
  matchedTopics: string[];
};

type ShortExerciseScenario = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  intensity: ExerciseIntensity;
  bvid: string;
  posterUrl: string;
};

type ShortExerciseAction = {
  name: string;
  cue: string;
  tags: string[];
};

type RecipeDataItem = {
  id: number | string;
  name: string;
  desc?: string;
  time?: string;
  cal?: number;
  type?: string;
  tags?: string[];
  img?: string;
};

const SHORT_EXERCISE_CLIP_COUNT = 500;
const SHORT_CLIP_DURATIONS_SECONDS = [10, 12, 15, 18, 20, 22, 25, 28, 30];

const shortExerciseScenarios: ShortExerciseScenario[] = [
  {
    id: 'neck_cramp_relief',
    title: '脖子抽筋应急放松',
    summary: '针对突发颈部紧绷，优先做轻柔回正动作，避免暴力扳脖。',
    tags: ['脖子抽筋', '肩颈', '应急放松', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'sedentary_neck_shoulder',
    title: '久坐肩颈唤醒',
    summary: '针对久坐后的肩颈酸胀，快速重启上背与肩胛活动。',
    tags: ['久坐', '肩颈', '办公室', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'head_down_relief',
    title: '低头族颈后链放松',
    summary: '针对长期看手机/电脑后的颈后紧张，做温和伸展与回正。',
    tags: ['低头族', '肩颈', '颈椎', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'office_round_shoulder_open',
    title: '办公室圆肩打开',
    summary: '改善伏案含胸姿势，短时间打开胸廓和肩前侧。',
    tags: ['办公室', '圆肩', '肩颈', '短时动作'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
  },
  {
    id: 'afternoon_scapula_activate',
    title: '午后肩胛激活',
    summary: '午后困倦和背部塌陷时，用短动作激活肩胛稳定。',
    tags: ['久坐', '肩胛', '办公室', '短时动作'],
    intensity: 'medium',
    bvid: 'BV1k94y1f7Vr',
    posterUrl: 'https://i1.hdslb.com/bfs/archive/0526b5a209bb9eb98c271a8bbd4282fcd92e7dc6.jpg',
  },
  {
    id: 'meeting_break_tspine',
    title: '开会间隙胸椎伸展',
    summary: '会议间隙做胸椎活动，缓解上背僵硬和呼吸受限。',
    tags: ['久坐', '胸椎', '办公室', '短时动作'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
  },
  {
    id: 'low_back_release',
    title: '腰背僵硬缓解',
    summary: '缓解久坐或久站导致的下背紧张，动作幅度小且可控。',
    tags: ['腰背', '久坐', '下背', '短时动作'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
  },
  {
    id: 'long_stand_calf_pump',
    title: '久站小腿泵激活',
    summary: '适合久站后下肢沉重感，快速促进踝泵与小腿循环。',
    tags: ['久站', '小腿', '循环', '短时动作'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
  },
  {
    id: 'commute_back_release',
    title: '通勤后下背减压',
    summary: '久坐通勤后快速放松腰背，恢复躯干活动度。',
    tags: ['通勤', '腰背', '久坐', '短时动作'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
  },
  {
    id: 'driving_shoulder_back',
    title: '驾车后肩背放松',
    summary: '长时间驾驶后做肩背轻松解，减少上背僵硬感。',
    tags: ['驾车', '肩背', '久坐', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'eye_fatigue_neck',
    title: '眼疲劳伴颈紧放松',
    summary: '缓解盯屏导致的眼周疲劳与颈肩连带紧张。',
    tags: ['眼疲劳', '肩颈', '办公室', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'forearm_wrist_relief',
    title: '鼠标手前臂放松',
    summary: '针对键鼠高频操作后的前臂酸胀，做短时松解动作。',
    tags: ['办公室', '前臂', '手腕', '短时动作'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
  },
  {
    id: 'morning_body_wake',
    title: '晨起全身唤醒',
    summary: '起床后用短动作激活关节，降低一天开始时的僵硬感。',
    tags: ['晨起', '全身激活', '恢复', '短时动作'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
  },
  {
    id: 'before_sleep_relax',
    title: '睡前轻柔拉伸',
    summary: '睡前降低肌肉紧绷和神经兴奋，帮助更快进入放松状态。',
    tags: ['助眠', '拉伸', '恢复', '短时动作'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
  },
  {
    id: 'home_core_micro',
    title: '居家核心微激活',
    summary: '短时建立躯干稳定，适合无器械、空间有限场景。',
    tags: ['核心', '居家', '稳定', '短时动作'],
    intensity: 'medium',
    bvid: 'BV1k94y1f7Vr',
    posterUrl: 'https://i1.hdslb.com/bfs/archive/0526b5a209bb9eb98c271a8bbd4282fcd92e7dc6.jpg',
  },
  {
    id: 'hip_flexor_open',
    title: '久坐髋屈肌伸展',
    summary: '针对久坐导致的髋前侧紧绷，帮助站立更舒展。',
    tags: ['久坐', '髋屈肌', '下肢', '短时动作'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
  },
  {
    id: 'glute_leg_activation',
    title: '臀腿快速唤醒',
    summary: '久坐后激活臀腿，改善站立稳定和步态发力。',
    tags: ['久坐', '臀腿', '激活', '短时动作'],
    intensity: 'medium',
    bvid: 'BV13g4y1q7pt',
    posterUrl: 'https://i1.hdslb.com/bfs/archive/77d9a7ba73c5f5e91bf27822738a5094bf02e146.jpg',
  },
  {
    id: 'breath_stress_release',
    title: '压力大时呼吸减压',
    summary: '通过短时呼吸和轻动作组合，快速降低紧张感。',
    tags: ['减压', '呼吸', '恢复', '短时动作'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
  },
  {
    id: 'forward_head_posture_fix',
    title: '颈椎前引姿态修复',
    summary: '通过轻量抗阻和回正，改善头前伸和上交叉体态。',
    tags: ['颈椎', '姿态', '肩颈', '短时动作'],
    intensity: 'medium',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
  {
    id: 'phone_neck_trap_relief',
    title: '手机党斜方肌放松',
    summary: '针对刷手机后的上斜方肌紧绷，做低幅度高频放松。',
    tags: ['低头族', '斜方肌', '肩颈', '短时动作'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
  },
];

const shortExerciseActions: ShortExerciseAction[] = [
  { name: '下巴微收回正', cue: '保持颈部中立位，缓慢收下巴后回到原位', tags: ['颈椎回正', '肩颈'] },
  { name: '颈侧轻压伸展', cue: '一侧耳朵靠近肩部，另一侧肩膀主动下沉', tags: ['拉伸', '肩颈'] },
  { name: '颈部小幅摆动', cue: '点头与回正小幅交替，避免大幅甩动', tags: ['放松', '肩颈'] },
  { name: '肩胛后缩夹背', cue: '双肩向后向下收紧，短暂停留后放松', tags: ['肩胛', '姿态'] },
  { name: '肩部环绕', cue: '双肩向后绕环，节奏均匀不耸肩', tags: ['肩部活动', '恢复'] },
  { name: '胸椎伸展开胸', cue: '双臂外展并轻微后伸，打开胸廓', tags: ['胸椎', '开胸'] },
  { name: '靠墙天使滑动', cue: '背靠墙缓慢上举下放手臂，保持腰背稳定', tags: ['姿态', '肩胛'] },
  { name: '门框拉胸', cue: '前臂扶门框，身体微微前移打开胸前侧', tags: ['拉伸', '开胸'] },
  { name: '头颈等长抗阻', cue: '手掌轻抵头部，颈部做轻量抗阻', tags: ['颈部力量', '稳定'] },
  { name: '上斜方肌松解', cue: '肩膀下沉配合呼气，放松上斜方肌', tags: ['斜方肌', '肩颈'] },
  { name: '提踵泵血', cue: '脚跟快速抬起再落下，激活小腿肌泵', tags: ['循环', '小腿'] },
  { name: '脚踝画圈', cue: '踝关节顺逆时针画圈，保持动作连贯', tags: ['踝关节', '下肢'] },
  { name: '髋屈肌弓步伸展', cue: '前后弓步保持骨盆中立，感受髋前侧拉伸', tags: ['髋屈肌', '拉伸'] },
  { name: '站姿体前屈放松', cue: '髋部折叠向前，膝盖微屈保护下背', tags: ['后链', '腰背'] },
  { name: '猫牛式微循环', cue: '脊柱轻柔屈伸交替，配合呼吸节奏', tags: ['脊柱活动', '腰背'] },
  { name: '鸟狗式点地', cue: '四点支撑交替伸展对侧手腿，核心保持稳定', tags: ['核心', '稳定'] },
  { name: '臀桥短促收缩', cue: '仰卧抬髋并短停，激活臀部发力', tags: ['臀部激活', '下背'] },
  { name: '靠墙静蹲', cue: '背靠墙微屈膝，均匀呼吸保持稳定', tags: ['下肢力量', '基础力量'] },
  { name: '站姿侧屈', cue: '一手上举侧向延展，保持骨盆稳定', tags: ['侧链拉伸', '全身'] },
  { name: '坐姿躯干旋转', cue: '坐姿双手抱胸，轻柔左右旋转胸椎', tags: ['胸椎', '久坐'] },
  { name: '前臂屈伸松解', cue: '手腕屈伸交替，缓解键鼠使用后的紧绷', tags: ['前臂', '手腕'] },
  { name: '手指张握激活', cue: '快速张开和握拳交替，改善手部僵硬', tags: ['手部激活', '办公室'] },
  { name: '深呼吸扩胸运动', cue: '吸气扩胸，呼气还原，节奏放慢', tags: ['呼吸', '减压'] },
  { name: '腹式呼吸放松', cue: '双手放腹部，呼气时感受腹部缓慢回落', tags: ['助眠', '呼吸'] },
  { name: '背部贴墙校正', cue: '后脑勺和肩背轻贴墙面，建立中立姿态', tags: ['姿态', '颈椎'] },
];

function buildShortExerciseClips(total: number): Array<Omit<Content, 'reason'>> {
  const clips: Array<Omit<Content, 'reason'>> = [];
  let idx = 0;

  for (const scenario of shortExerciseScenarios) {
    for (const action of shortExerciseActions) {
      if (idx >= total) return clips;
      const durationSeconds = SHORT_CLIP_DURATIONS_SECONDS[idx % SHORT_CLIP_DURATIONS_SECONDS.length];
      const calorieFactor = scenario.intensity === 'low' ? 0.35 : scenario.intensity === 'medium' ? 0.5 : 0.7;
      const calories = Math.max(4, Math.round(durationSeconds * calorieFactor));
      const serial = String(idx + 1).padStart(3, '0');

      clips.push({
        id: `video_micro_${serial}`,
        type: 'exercise',
        title: `${scenario.title}·${action.name}`,
        description: `${scenario.summary}${action.cue}，单次${durationSeconds}秒，适合碎片时间跟练。`,
        duration: durationSeconds,
        durationSeconds,
        calories,
        tags: Array.from(
          new Set([...scenario.tags, ...action.tags, '基础动作', '动作片段', '运动视频'])
        ),
        intensity: scenario.intensity,
        bvid: scenario.bvid,
        posterUrl: scenario.posterUrl,
        url: `/pages/exercise/list.html?bvid=${scenario.bvid}`,
      });

      idx += 1;
    }
  }

  return clips;
}

const contentCatalog: Array<Omit<Content, 'reason'>> = [
  // Recipes
  {
    id: 'recipe_oats_chicken_bowl',
    type: 'recipe',
    title: '燕麦鸡胸肉蔬菜碗',
    description: '高蛋白+高纤维，稳血糖更耐饿',
    time: '15分钟',
    calories: 480,
    tags: ['控糖', '减脂', '高蛋白', '高纤维', '均衡营养', '早餐', '快手'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_steamed_fish_low_salt',
    type: 'recipe',
    title: '低盐清蒸鲈鱼',
    description: '清淡少油，适合血脂/血压管理',
    time: '20分钟',
    calories: 220,
    tags: ['控脂', '心血管', '低盐', '清淡', '血压友好', '晚餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_tomato_tofu_soup',
    type: 'recipe',
    title: '番茄豆腐汤',
    description: '清淡易消化，适合护肝/控脂的日常搭配',
    time: '15分钟',
    calories: 160,
    tags: ['护肝', '控脂', '清淡', '养胃', '素食', '汤类', '晚餐', '快手'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_tomato_egg',
    type: 'recipe',
    title: '番茄炒蛋',
    description: '经典快手菜，10分钟就能上桌',
    time: '10分钟',
    calories: 150,
    tags: ['番茄鸡蛋', '快手', '家常', '晚餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_tomato_egg_noodle',
    type: 'recipe',
    title: '西红柿鸡蛋面',
    description: '一锅搞定的主食+蛋白组合',
    time: '15分钟',
    calories: 360,
    tags: ['番茄鸡蛋', '快手', '主食', '早餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_winter_melon_egg_soup',
    type: 'recipe',
    title: '冬瓜香菇鸡蛋汤',
    description: '低嘌呤思路的清淡汤品，适合尿酸管理期',
    time: '20分钟',
    calories: 140,
    tags: ['低嘌呤', '清淡', '养胃', '汤类', '晚餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_brown_rice_veggie',
    type: 'recipe',
    title: '糙米杂蔬饭',
    description: '膳食纤维更高，适合控糖控脂的人群',
    time: '30分钟',
    calories: 420,
    tags: ['控糖', '控脂', '高纤维', '均衡营养', '素食', '晚餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_broccoli_low_oil',
    type: 'recipe',
    title: '蒜蓉西兰花（少油版）',
    description: '低能量高纤维，适合减脂控脂',
    time: '10分钟',
    calories: 90,
    tags: ['减脂', '控脂', '高纤维', '清淡', '素食', '快手', '家常', '晚餐'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_beef_potato_veg',
    type: 'recipe',
    title: '牛肉土豆杂蔬焖菜',
    description: '低脂高蛋白的健康菜肴',
    time: '30分钟',
    calories: 378,
    tags: ['减脂', '高蛋白', '家常'],
    url: '/pages/recipe/list.html',
  },
  {
    id: 'recipe_chicken_veggie_noodles',
    type: 'recipe',
    title: '玉米鸡胸肉蔬菜焖面',
    description: '营养均衡的主食选择',
    time: '25分钟',
    calories: 513,
    tags: ['均衡营养', '高蛋白', '恢复', '主食', '早餐'],
    url: '/pages/recipe/list.html',
  },

  // Exercise videos (Bilibili)
  {
    id: 'video_tabata_30',
    type: 'exercise',
    title: '30分钟 Tabata 全身燃脂训练',
    description: '高强度间歇训练，适合想快速进入燃脂状态的用户（无明显运动禁忌时）',
    duration: 30,
    calories: 400,
    tags: ['燃脂', '高强度', '减脂', '控脂', '运动视频', '跟练', '课程视频'],
    intensity: 'high',
    bvid: 'BV1oQTnzXEDr',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/b0865ee32908b9417b195a1dcf1f27966d767ff7.jpg',
    url: '/pages/exercise/list.html?bvid=BV1oQTnzXEDr',
  },
  {
    id: 'video_dance_fat_15',
    type: 'exercise',
    title: '15分钟舞蹈全身燃脂',
    description: '节奏轻快，新手友好，适合碎片化燃脂',
    duration: 15,
    calories: 200,
    tags: ['燃脂', '中强度', '新手友好', '减脂', '恢复', '运动视频', '跟练', '课程视频'],
    intensity: 'medium',
    bvid: 'BV13g4y1q7pt',
    posterUrl: 'https://i1.hdslb.com/bfs/archive/77d9a7ba73c5f5e91bf27822738a5094bf02e146.jpg',
    url: '/pages/exercise/list.html?bvid=BV13g4y1q7pt',
  },
  {
    id: 'video_baduanjin',
    type: 'exercise',
    title: '八段锦完整版（国家体育总局）',
    description: '节奏稳定、呼吸清晰，适合恢复型与长期习惯型运动',
    duration: 12,
    calories: 100,
    tags: ['八段锦', '低强度', '养生', '血压友好', '恢复', '新手友好', '运动视频', '跟练', '课程视频'],
    intensity: 'low',
    bvid: 'BV1VsDpYXEqD',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/e89074784b5dddaacde109e8c3bd4528e4a85138.jpg',
    url: '/pages/exercise/list.html?bvid=BV1VsDpYXEqD',
  },
  {
    id: 'video_yoga_beginner_50',
    type: 'exercise',
    title: '50分钟初学者入门瑜伽',
    description: '舒展放松，提升柔韧性，适合作为压力与僵硬的“恢复日”',
    duration: 50,
    calories: 120,
    tags: ['瑜伽', '中低强度', '减压', '恢复', '运动视频', '跟练', '课程视频'],
    intensity: 'medium',
    bvid: 'BV1xV411y7c2',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/edea56107a1650c834ef1aec9435b4c76fb38400.jpg',
    url: '/pages/exercise/list.html?bvid=BV1xV411y7c2',
  },
  {
    id: 'video_core_strength_20',
    type: 'exercise',
    title: '核心力量训练',
    description: '强化腹部与躯干稳定，适合建立基础力量或改善姿态控制',
    duration: 20,
    calories: 200,
    tags: ['力量', '核心', '高强度', '增肌', '运动视频', '跟练', '课程视频'],
    intensity: 'high',
    bvid: 'BV1k94y1f7Vr',
    posterUrl: 'https://i1.hdslb.com/bfs/archive/0526b5a209bb9eb98c271a8bbd4282fcd92e7dc6.jpg',
    url: '/pages/exercise/list.html?bvid=BV1k94y1f7Vr',
  },
  {
    id: 'video_neck_shoulder_10',
    type: 'exercise',
    title: '10分钟肩颈舒缓拉伸',
    description: '久坐低头族友好，坐姿拉伸+放松动作，适合碎片时间跟练',
    duration: 10,
    calories: 40,
    tags: ['拉伸', '肩颈', '低强度', '恢复', '运动视频', '跟练', '课程视频', '办公室'],
    intensity: 'low',
    bvid: 'BV1vu411e7fC',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/a902b9961903db6d795ba9e62ad191ed7d6fa6da.jpg',
    url: '/pages/exercise/list.html?bvid=BV1vu411e7fC',
  },
  {
    id: 'video_bed_stretch_5',
    type: 'exercise',
    title: '5分钟睡前床上拉伸',
    description: '动作温和、节奏放慢，适合睡前或加班后放松',
    duration: 5,
    tags: ['拉伸', '助眠', '低强度', '恢复', '运动视频', '跟练', '课程视频'],
    intensity: 'low',
    bvid: 'BV1sx41137qi',
    posterUrl: 'https://i0.hdslb.com/bfs/archive/09110586bb8ac07ae7ab3b91761e1bddf45a8534.jpg',
    url: '/pages/exercise/list.html?bvid=BV1sx41137qi',
  },
  {
    id: 'video_full_body_stretch_10',
    type: 'exercise',
    title: '10分钟全身拉伸',
    description: '运动前后、睡前和晨起都能跟练，快速缓解肌肉紧张',
    duration: 10,
    calories: 50,
    tags: ['拉伸', '低强度', '恢复', '新手友好', '运动视频', '跟练', '课程视频'],
    intensity: 'low',
    bvid: 'BV1ga411w7i3',
    posterUrl: 'https://i2.hdslb.com/bfs/archive/64a46fcd19aeb36e08ccf9ef2f544f624dc83a7d.jpg',
    url: '/pages/exercise/list.html?bvid=BV1ga411w7i3',
  },

  // Psychology / Sleep
  {
    id: 'sleep_relax_7days',
    type: 'sleep',
    title: '7天轻松入睡',
    description: '建立睡前仪式感，改善睡眠质量',
    duration: 7 * 15,
    tags: ['助眠', '作息', '恢复'],
    url: '/pages/sleep/list.html',
  },
  {
    id: 'psychology_mindfulness_7days',
    type: 'psychology',
    title: '7天正念减压',
    description: '缓解压力与焦虑，帮助提升情绪稳定性',
    duration: 7 * 15,
    tags: ['减压', '焦虑'],
    url: '/pages/psychology/list.html',
  },
];

contentCatalog.push(...buildShortExerciseClips(SHORT_EXERCISE_CLIP_COUNT));

const productCatalog: Product[] = [
  { id: 'product_1', name: '同仁堂西洋参片', category: '滋补养生', price: 298, imageUrl: '/images/product_1.jpg', tags: ['滋补', '养生'] },
  { id: 'product_2', name: '同仁堂阿胶糕', category: '滋补养生', price: 168, imageUrl: '/images/product_2.jpg', tags: ['补血', '养颜'] },
  { id: 'product_3', name: '蜂蜜', category: '养生食品', price: 89, imageUrl: '/images/product_3.jpg', tags: ['润燥'] },
];

const pageCatalog: Page[] = [
  { name: '精准健康', url: '/pages/health-profile/index.html' },
  { name: '体检报告分析', url: '/pages/report-analysis/index.html' },
];

const EXERCISE_INTENSITY_RANK: Record<ExerciseIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};
const RECIPE_DATA_FILE = path.resolve(__dirname, '../../../data/recipes.js');
const DIVERSITY_CANDIDATE_WINDOW = 24;
const DIVERSITY_HISTORY_LIMIT = 48;
const SIGNATURE_RECIPE_IDS = [
  'recipe_steamed_fish_low_salt',
  'recipe_oats_chicken_bowl',
  'recipe_tomato_tofu_soup',
] as const;
const SIGNATURE_RECIPE_ORDER = new Map<string, number>(
  SIGNATURE_RECIPE_IDS.map((id, index) => [id, SIGNATURE_RECIPE_IDS.length - index])
);
const SIGNATURE_RECIPE_TRIGGER_TOPICS = new Set<string>([
  '控糖',
  '控脂',
  '减脂',
  '高蛋白',
  '高纤维',
  '低盐',
  '血压管理',
  '血压友好',
  '心血管',
  '清淡',
  '养胃',
  '护肝',
  '素食',
  '均衡营养',
]);
const REPORT_CONSERVATIVE_EXERCISE_TOPICS = new Set<string>([
  '控糖',
  '控脂',
  '减脂',
  '低嘌呤',
  '护肝',
  '护肾',
  '心血管',
  '低盐',
  '血压管理',
]);
const REPORT_EXERCISE_BRIDGE_RULES: Array<{
  from: string[];
  topics: Array<{ topic: string; weight: number }>;
}> = [
  {
    from: ['控糖'],
    topics: [
      { topic: '减脂', weight: 2.0 },
      { topic: '新手友好', weight: 1.1 },
    ],
  },
  {
    from: ['控脂'],
    topics: [
      { topic: '减脂', weight: 2.2 },
      { topic: '新手友好', weight: 1.0 },
    ],
  },
  {
    from: ['心血管', '低盐', '血压管理'],
    topics: [
      { topic: '血压友好', weight: 2.4 },
      { topic: '低强度', weight: 2.1 },
      { topic: '新手友好', weight: 1.0 },
    ],
  },
  {
    from: ['低嘌呤'],
    topics: [
      { topic: '低强度', weight: 2.1 },
    ],
  },
  {
    from: ['护肝', '护肾'],
    topics: [
      { topic: '低强度', weight: 1.9 },
    ],
  },
  {
    from: ['养胃', '清淡'],
    topics: [
      { topic: '低强度', weight: 1.2 },
    ],
  },
  {
    from: ['助眠'],
    topics: [
      { topic: '低强度', weight: 1.0 },
    ],
  },
  {
    from: ['减压'],
    topics: [
      { topic: '低强度', weight: 1.0 },
    ],
  },
];
const REPORT_SPECIAL_FINDING_TOPIC_RULES: Array<{
  codes: Set<string>;
  topics: Array<{ topic: string; weight: number }>;
  exerciseCap?: ExerciseIntensity;
}> = [
  {
    codes: new Set([
      'THYROID_NODULE',
      'THYROID_CYST',
      'THYROID_ECHO_UNEVEN',
      'THYROID_DIFFUSE',
      'THYROID_ENLARGED',
      'THYROID_CALCIFICATION',
      'HASHIMOTO_LIKE',
    ]),
    topics: [
      { topic: '恢复', weight: 2.2 },
      { topic: '清淡', weight: 1.8 },
      { topic: '低强度', weight: 1.5 },
      { topic: '均衡营养', weight: 1.2 },
    ],
    exerciseCap: 'medium',
  },
  {
    codes: new Set([
      'BREAST_NODULE',
      'BREAST_CYST',
      'BREAST_HYPERPLASIA',
      'BREAST_LOBULAR_HYPERPLASIA',
      'BREAST_FIBROADENOMA',
      'BREAST_DUCT_DILATION',
      'BREAST_CALCIFICATION',
    ]),
    topics: [
      { topic: '恢复', weight: 2.2 },
      { topic: '清淡', weight: 1.8 },
      { topic: '低强度', weight: 1.5 },
      { topic: '均衡营养', weight: 1.2 },
    ],
    exerciseCap: 'medium',
  },
  {
    codes: new Set([
      'LUNG_NODULE',
      'LUNG_MICRONODULE',
      'GROUND_GLASS_NODULE',
      'LUNG_MARKINGS',
      'CHRONIC_BRONCHITIS',
      'EMPHYSEMA',
      'PLEURAL_THICKENING',
      'LUNG_CALCIFICATION',
      'OLD_LUNG_LESION',
      'PULMONARY_BULLA',
      'BRONCHIECTASIS',
      'PULMONARY_FIBROSIS',
    ]),
    topics: [
      { topic: '低强度', weight: 2.8 },
      { topic: '恢复', weight: 2.4 },
      { topic: '清淡', weight: 1.4 },
    ],
    exerciseCap: 'low',
  },
];

function uniqueStringList(values: string[], limit: number = 8): string[] {
  return Array.from(
    new Set(
      values
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  ).slice(0, limit);
}

function parseTimeMinutes(raw: unknown): number | undefined {
  const text = String(raw || '').trim();
  if (!text) return undefined;
  const matched = text.match(/(\d+(?:\.\d+)?)\s*分钟/);
  if (!matched) return undefined;
  const value = Number(matched[1]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function normalizeSearchableText(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[（）()·,，。、“”\-_/:+]/g, '');
}

function buildContentSearchText(content: Omit<Content, 'reason'>): string {
  return normalizeSearchableText(
    [
      content.title,
      content.description,
      content.time,
      Array.isArray(content.tags) ? content.tags.join(' ') : '',
    ].join(' ')
  );
}

const TOPIC_CONTENT_ALIASES: Record<string, string[]> = {
  控糖: ['控糖', '稳血糖', '低糖', '燕麦', '全麦', '杂粮'],
  控脂: ['控脂', '低脂', '少油', '轻食', '燃脂'],
  心血管: ['心血管', '护心', '鱼类', '清蒸', '有氧'],
  低盐: ['低盐', '少盐', '清淡'],
  血压管理: ['血压管理', '血压友好', '低盐', '低强度'],
  血压友好: ['血压友好', '低强度', '恢复', '八段锦'],
  低嘌呤: ['低嘌呤', '尿酸'],
  护肝: ['护肝', '低脂', '清淡', '恢复'],
  护肾: ['护肾', '清淡', '低强度'],
  减脂: ['减脂', '燃脂', '低脂', '轻食'],
  高蛋白: ['高蛋白', '鸡胸', '鱼', '豆腐', '鸡蛋'],
  高纤维: ['高纤维', '燕麦', '全麦', '杂蔬', '蔬菜'],
  清淡: ['清淡', '少油', '低负担', '易消化', '汤'],
  养胃: ['养胃', '暖胃', '易消化', '汤'],
  素食: ['素食', '豆腐', '蔬菜'],
  均衡营养: ['均衡营养', '杂蔬', '蛋白', '主食'],
  恢复: ['恢复', '放松', '舒缓', '拉伸', '八段锦'],
  新手友好: ['新手友好', '入门', '基础', '低强度'],
  短时动作: ['短时动作', '动作片段', '碎片时间', '10秒', '20秒', '30秒', '5分钟', '10分钟'],
  运动视频: ['运动视频', '课程视频', '视频', '课程', '跟练', '动作片段'],
  跟练: ['跟练', '视频', '课程'],
  早餐: ['早餐', '早饭', '晨起', '燕麦', '粥', '三明治', '鸡蛋饼'],
  晚餐: ['晚餐', '晚饭', '清淡', '低负担', '易消化', '汤'],
  快手: ['快手', '10分钟', '12分钟', '15分钟', '一锅', '省事'],
  汤类: ['汤', '羹', '炖'],
  家常: ['家常', '下饭', '快手'],
  办公室: ['办公室', '工位', '久坐', '伏案', '通勤'],
  拉伸: ['拉伸', '伸展', '放松'],
  肩颈: ['肩颈', '颈椎', '斜方肌', '开胸', '肩背'],
  腰背: ['腰背', '下背', '核心', '臀桥'],
  久坐: ['久坐', '办公室', '通勤', '驾车'],
  助眠: ['助眠', '睡前', '放松', '轻柔'],
  减压: ['减压', '呼吸', '放松', '正念'],
};

function loadRecipeDataFile(): RecipeDataItem[] {
  try {
    if (!fs.existsSync(RECIPE_DATA_FILE)) {
      return [];
    }

    const source = fs.readFileSync(RECIPE_DATA_FILE, 'utf8');
    const sandbox: { __RECIPES__?: unknown } = {};
    vm.runInNewContext(`${source}\nthis.__RECIPES__ = recipes;`, sandbox, { timeout: 1000 });
    return Array.isArray(sandbox.__RECIPES__)
      ? sandbox.__RECIPES__.filter((item) => item && typeof item === 'object') as RecipeDataItem[]
      : [];
  } catch (error) {
    console.warn('加载食谱数据失败，将继续使用内置食谱推荐：', error);
    return [];
  }
}

function deriveRecipeRecommendationTags(recipe: RecipeDataItem): string[] {
  const type = String(recipe.type || '').trim();
  const rawTags = Array.isArray(recipe.tags) ? recipe.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [];
  const combined = [recipe.name, recipe.desc, type, ...rawTags].join(' ');
  const tags = new Set<string>();
  const timeMinutes = parseTimeMinutes(recipe.time);

  const add = (...values: string[]) => {
    values.forEach((value) => {
      const safeValue = String(value || '').trim();
      if (safeValue) tags.add(safeValue);
    });
  };

  if (type === '汤类') add('清淡', '恢复');
  if (type === '药膳') add('恢复');
  if (type === '素食') add('素食', '高纤维', '清淡');
  if (type === '早餐') add('均衡营养', '高蛋白');
  if (type === '早餐') add('早餐');
  if (type === '汤类') add('汤类');
  if (type === '家常菜') add('家常');
  if (type === '药膳') add('汤类');
  if (timeMinutes !== undefined && timeMinutes <= 15) add('快手');
  if (/早餐|早饭/.test(combined)) add('早餐');
  if (/晚餐|晚饭/.test(combined)) add('晚餐');
  if (/汤|羹|炖/.test(combined)) add('汤类');
  if (/家常|下饭/.test(combined)) add('家常');
  if (/快手|10分钟|15分钟|简单易做|一锅/.test(combined)) add('快手');
  if (
    /晚餐|晚饭|睡前|低负担|易消化/.test(combined) ||
    ((type === '汤类' || /清淡|低脂/.test(combined)) && timeMinutes !== undefined && timeMinutes <= 25) ||
    (typeof recipe.cal === 'number' && recipe.cal > 0 && recipe.cal <= 220 && /清淡|汤|低脂/.test(combined))
  ) {
    add('晚餐');
  }

  if (/低盐|少盐|高血压|血压|心血管/.test(combined)) add('低盐', '心血管', '血压友好');
  if (/糖|燕麦|全麦|稳糖|控糖/.test(combined)) add('控糖');
  if (/低脂|控脂|减脂|轻食/.test(combined)) add('控脂', '减脂');
  if (/纤维|通便|蔬食|蔬菜/.test(combined)) add('高纤维');
  if (/鸡胸|鸡蛋|豆腐|鱼|牛奶|虾|蛋白/.test(combined)) add('高蛋白');
  if (/清淡|爽口|低负担|汤/.test(combined)) add('清淡');
  if (/养胃|健脾|开胃|暖胃|消食/.test(combined)) add('养胃');
  if (/免疫|抗疲劳|元气|滋补|补气|补血|养生|调理|恢复/.test(combined)) add('恢复');
  if (/护肝|肝肾/.test(combined)) add('护肝');
  if (/补肾/.test(combined)) add('护肾');

  rawTags.forEach((tag) => {
    if (/高纤|纤维/.test(tag)) add('高纤维');
    if (/低脂|控脂/.test(tag)) add('控脂');
    if (/清淡/.test(tag)) add('清淡');
    if (/补气|养血|元气|滋补|免疫|抗疲劳/.test(tag)) add('恢复');
    if (/补肾/.test(tag)) add('护肾');
    if (/补肝|肝/.test(tag)) add('护肝');
  });

  return uniqueStringList([...rawTags, ...Array.from(tags)], 8);
}

function buildRecipeContentsFromData(existingTitles: Set<string>): Array<Omit<Content, 'reason'>> {
  const recipeData = loadRecipeDataFile();
  return recipeData
    .filter((recipe) => recipe && recipe.id !== undefined && recipe.name)
    .filter((recipe) => !existingTitles.has(String(recipe.name).trim()))
    .map((recipe) => ({
      id: String(recipe.id),
      type: 'recipe' as const,
      title: String(recipe.name).trim(),
      description: String(recipe.desc || '根据你的健康目标推荐').trim(),
      time: String(recipe.time || '').trim() || undefined,
      calories: Number.isFinite(Number(recipe.cal)) ? Number(recipe.cal) : undefined,
      tags: deriveRecipeRecommendationTags(recipe),
      imageUrl: typeof recipe.img === 'string' ? recipe.img.trim() : undefined,
      url: '/pages/recipe/list.html',
    }));
}

const existingRecipeTitles = new Set<string>(
  contentCatalog
    .filter((content) => content.type === 'recipe')
    .map((content) => String(content.title || '').trim())
    .filter(Boolean)
);

contentCatalog.push(...buildRecipeContentsFromData(existingRecipeTitles));

const CONTENT_STORE_DIR = path.resolve(__dirname, '../../uploads/content');
const RECIPES_STORE_FILE = path.join(CONTENT_STORE_DIR, 'recipes.json');
const EXERCISE_VIDEOS_STORE_FILE = path.join(CONTENT_STORE_DIR, 'exercise-videos.json');

const recipeSeedCatalog: RecipeCatalogItem[] = contentCatalog
  .filter((content): content is RecipeCatalogItem => content.type === 'recipe')
  .map((content) => ({ ...content }));
const exerciseSeedCatalog: ExerciseCatalogItem[] = contentCatalog
  .filter((content): content is ExerciseCatalogItem => content.type === 'exercise')
  .map((content) => ({ ...content }));
const staticContentCatalog: ContentCatalogItem[] = contentCatalog
  .filter((content) => content.type !== 'recipe' && content.type !== 'exercise')
  .map((content) => ({ ...content }));

function ensureContentStoreDir(): void {
  if (!fs.existsSync(CONTENT_STORE_DIR)) {
    fs.mkdirSync(CONTENT_STORE_DIR, { recursive: true });
  }
}

function writeJsonFile(filePath: string, payload: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function ensureCatalogStoreFiles(): void {
  ensureContentStoreDir();

  if (!fs.existsSync(RECIPES_STORE_FILE)) {
    writeJsonFile(RECIPES_STORE_FILE, recipeSeedCatalog);
  }
  if (!fs.existsSync(EXERCISE_VIDEOS_STORE_FILE)) {
    writeJsonFile(EXERCISE_VIDEOS_STORE_FILE, exerciseSeedCatalog);
  }
}

function readJsonArray(filePath: string): unknown[] | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn(`读取内容库失败（${path.basename(filePath)}），将回退到默认内容：`, error);
    return null;
  }
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return Array.from(
    new Set(
      raw
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
}

function parseFiniteNumber(raw: unknown): number | undefined {
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function normalizeRecipeContent(raw: unknown): RecipeCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const id = String(item.id || '').trim();
  const title = String(item.title || '').trim();
  if (!id || !title) return null;

  const description = String(item.description || '根据你的健康目标推荐').trim() || '根据你的健康目标推荐';
  const time = typeof item.time === 'string' ? item.time.trim() : '';
  const combined = [title, description, time].join(' ');
  const supplementalTags = (() => {
    const timeMinutes = parseTimeMinutes(time);
    const tags: string[] = [];
    if (/早餐|早饭|燕麦|早餐碗|早餐杯|三明治|鸡蛋饼/.test(combined)) tags.push('早餐');
    if (
      /晚餐|晚饭|夜宵|宵夜/.test(combined) ||
      ((/清淡|低负担|易消化|汤/.test(combined)) && timeMinutes !== undefined && timeMinutes <= 25)
    ) {
      tags.push('晚餐');
    }
    if (/快手|一锅|简单|懒人/.test(combined) || (timeMinutes !== undefined && timeMinutes <= 15)) tags.push('快手');
    if (/汤|羹|炖/.test(combined)) tags.push('汤类');
    if (/家常|下饭/.test(combined)) tags.push('家常');
    if (/糖|燕麦|全麦|稳糖|控糖/.test(combined)) tags.push('控糖');
    if (/低脂|控脂|减脂|轻食/.test(combined)) tags.push('控脂', '减脂');
    if (/鸡胸|鸡蛋|豆腐|鱼|虾|牛奶|高蛋白/.test(combined)) tags.push('高蛋白');
    return tags;
  })();
  const normalized: RecipeCatalogItem = {
    id,
    type: 'recipe',
    title,
    description,
    tags: uniqueStringList([...normalizeTags(item.tags), ...supplementalTags], 12),
    url: '/pages/recipe/list.html',
  };

  if (time) normalized.time = time;

  const calories = parseFiniteNumber(item.calories);
  if (calories !== undefined) normalized.calories = calories;

  const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';
  if (imageUrl) normalized.imageUrl = imageUrl;

  const url = typeof item.url === 'string' ? item.url.trim() : '';
  if (url) normalized.url = url;

  return normalized;
}

function normalizeExerciseIntensity(raw: unknown): ExerciseIntensity {
  if (raw === 'low' || raw === 'medium' || raw === 'high') {
    return raw;
  }
  return 'low';
}

function normalizeExerciseContent(raw: unknown): ExerciseCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  const id = String(item.id || '').trim();
  const title = String(item.title || '').trim();
  if (!id || !title) return null;

  const description = String(item.description || '根据你的健康目标推荐').trim() || '根据你的健康目标推荐';
  const normalizedTags = normalizeTags(item.tags);
  const bvid = typeof item.bvid === 'string' ? item.bvid.trim() : '';
  const duration = parseFiniteNumber(item.duration);
  const durationSeconds = parseFiniteNumber(item.durationSeconds);
  const intensity = normalizeExerciseIntensity(item.intensity);
  const normalized: ExerciseCatalogItem = {
    id,
    type: 'exercise',
    title,
    description,
    tags: uniqueStringList([
      ...normalizedTags,
      '运动视频',
      bvid ? '跟练' : '',
      intensity === 'low' ? '低强度' : intensity === 'medium' ? '中等强度' : '高强度',
      durationSeconds !== undefined && durationSeconds > 0 && durationSeconds <= 120 ? '动作片段' : '课程视频',
    ], 12),
    intensity,
    url: '/pages/exercise/list.html',
  };

  const calories = parseFiniteNumber(item.calories);
  if (calories !== undefined) normalized.calories = calories;

  if (duration !== undefined) normalized.duration = duration;

  if (durationSeconds !== undefined) normalized.durationSeconds = durationSeconds;

  if (bvid) {
    normalized.bvid = bvid;
    normalized.url = `/pages/exercise/list.html?bvid=${bvid}`;
  }

  const posterUrl = typeof item.posterUrl === 'string' ? item.posterUrl.trim() : '';
  if (posterUrl) normalized.posterUrl = posterUrl;

  const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : '';
  if (imageUrl) normalized.imageUrl = imageUrl;

  const url = typeof item.url === 'string' ? item.url.trim() : '';
  if (url) normalized.url = url;

  return normalized;
}

function dedupeById<T extends ContentCatalogItem>(items: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of items) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

function loadStoredCatalog<T extends ContentCatalogItem>(
  filePath: string,
  fallback: T[],
  normalize: (raw: unknown) => T | null
): T[] {
  const rawList = readJsonArray(filePath);
  if (!rawList) return fallback.map((item) => ({ ...item }));

  const normalized = rawList
    .map(normalize)
    .filter((item): item is T => Boolean(item));

  if (normalized.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }

  return dedupeById(normalized);
}

function loadStoredRecipes(): RecipeCatalogItem[] {
  ensureCatalogStoreFiles();
  return loadStoredCatalog(RECIPES_STORE_FILE, recipeSeedCatalog, normalizeRecipeContent);
}

function loadStoredExerciseVideos(): ExerciseCatalogItem[] {
  ensureCatalogStoreFiles();
  return loadStoredCatalog(EXERCISE_VIDEOS_STORE_FILE, exerciseSeedCatalog, normalizeExerciseContent);
}

function replaceStoredRecipes(items: unknown): RecipeCatalogItem[] {
  ensureCatalogStoreFiles();
  if (!Array.isArray(items)) {
    throw new Error('recipes body 必须是数组');
  }

  const normalized = dedupeById(
    items
      .map(normalizeRecipeContent)
      .filter((item): item is RecipeCatalogItem => Boolean(item))
  );

  writeJsonFile(RECIPES_STORE_FILE, normalized);
  return normalized;
}

function replaceStoredExerciseVideos(items: unknown): ExerciseCatalogItem[] {
  ensureCatalogStoreFiles();
  if (!Array.isArray(items)) {
    throw new Error('exercise videos body 必须是数组');
  }

  const normalized = dedupeById(
    items
      .map(normalizeExerciseContent)
      .filter((item): item is ExerciseCatalogItem => Boolean(item))
  );

  writeJsonFile(EXERCISE_VIDEOS_STORE_FILE, normalized);
  return normalized;
}

function loadBackendContentCatalog(): ContentCatalogItem[] {
  return [
    ...staticContentCatalog.map((item) => ({ ...item })),
    ...loadStoredRecipes(),
    ...loadStoredExerciseVideos(),
  ];
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase();
}

function addTopic(
  signals: RecommendationSignals,
  topic: string,
  evidence: string,
  weight: number = 1
): void {
  signals.topics.add(topic);
  const existing = signals.topicEvidence.get(topic) ?? new Set<string>();
  existing.add(evidence);
  signals.topicEvidence.set(topic, existing);
  signals.topicWeights.set(topic, (signals.topicWeights.get(topic) ?? 0) + weight);
}

function hasMeaningfulProfile(profile: RecommendationOptions['profile']): boolean {
  if (!profile) return false;
  return Boolean(
    (profile.chronicDisease && profile.chronicDisease.length > 0) ||
    (profile.symptoms && profile.symptoms.length > 0) ||
    (profile.healthGoals && profile.healthGoals.length > 0) ||
    (profile.allergy && profile.allergy.length > 0) ||
    (profile.medicationHistory && profile.medicationHistory.length > 0) ||
    profile.age ||
    profile.dietHabit ||
    profile.exerciseHabit ||
    profile.sleepInfo ||
    profile.constitutionType
  );
}

function lowerExerciseMaxIntensity(
  signals: RecommendationSignals,
  next: ExerciseIntensity
): void {
  if (EXERCISE_INTENSITY_RANK[next] < EXERCISE_INTENSITY_RANK[signals.exerciseMaxIntensity]) {
    signals.exerciseMaxIntensity = next;
  }
}

function compactEvidenceLabel(evidence: string): string {
  const text = String(evidence || '').trim();
  if (!text) return '';
  if (text === '用户提问' || text === '场景默认' || text === '食材提问') {
    return '';
  }
  return text
    .replace(/^健康档案：/, '')
    .replace(/^健康目标：/, '')
    .replace(/^生活习惯：/, '')
    .replace(/^体质信息：/, '')
    .replace(/^报告异常：/, '')
    .replace(/^报告建议：/, '')
    .replace(/^年龄：/, '')
    .replace(/^性别：/, '');
}

function getTopicPresentationPriority(
  topic: string,
  signals: RecommendationSignals,
  scene: string
): number {
  const evidences = Array.from(signals.topicEvidence.get(topic) ?? []);
  const hasQuestionEvidence = evidences.some((item) => item === '用户提问' || item === '食材提问');
  const hasReportEvidence = evidences.some((item) => item.startsWith('报告异常：') || item.startsWith('报告建议：'));
  const hasProfileEvidence = evidences.some((item) =>
    item.startsWith('健康档案：') ||
    item.startsWith('健康目标：') ||
    item.startsWith('生活习惯：') ||
    item.startsWith('体质信息：') ||
    item.startsWith('年龄：') ||
    item.startsWith('性别：')
  );
  const hasDefaultEvidence = evidences.some((item) => item === '场景默认');

  if (scene === 'report') {
    if (hasReportEvidence) return 4;
    if (hasQuestionEvidence) return 3;
    if (hasProfileEvidence) return 2;
    if (hasDefaultEvidence) return 0;
    return 1;
  }

  if (hasQuestionEvidence) return 4;
  if (hasProfileEvidence) return 3;
  if (hasReportEvidence) return 2;
  if (hasDefaultEvidence) return 0;
  return 1;
}

function sortTopicsForPresentation(
  topics: string[],
  signals: RecommendationSignals,
  scene: string
): string[] {
  return [...topics].sort((a, b) => {
    const priorityDiff = getTopicPresentationPriority(b, signals, scene) - getTopicPresentationPriority(a, signals, scene);
    if (priorityDiff !== 0) return priorityDiff;
    return (signals.topicWeights.get(b) ?? 0) - (signals.topicWeights.get(a) ?? 0);
  });
}

function buildEvidenceBadges(matchedTopics: string[], signals: RecommendationSignals, scene: string): string[] {
  const badges: string[] = [];
  const sortedTopics = sortTopicsForPresentation(matchedTopics, signals, scene);

  sortedTopics.slice(0, 3).forEach((topic) => {
    const evidenceLabels = Array.from(signals.topicEvidence.get(topic) ?? [])
      .map(compactEvidenceLabel)
      .filter(Boolean);

    if (evidenceLabels.length > 0) {
      badges.push(...evidenceLabels.slice(0, 2));
      return;
    }

    if (topic) {
      badges.push(topic);
    }
  });

  return uniqueStringList(badges, 3);
}

function extractTopicsFromTextEntries(
  entries: string[] | undefined,
  signals: RecommendationSignals,
  rules: Array<{ pattern: RegExp; topics: Array<{ topic: string; weight: number }> }>,
  evidencePrefix: string
): void {
  for (const raw of entries ?? []) {
    const text = String(raw || '').trim();
    const normalized = normalizeText(text);
    if (!normalized) continue;

    for (const rule of rules) {
      if (!rule.pattern.test(normalized)) continue;
      for (const topicRule of rule.topics) {
        addTopic(signals, topicRule.topic, `${evidencePrefix}：${text}`, topicRule.weight);
      }
    }
  }
}

function extractTopicsFromMessage(message: string, signals: RecommendationSignals): void {
  const m = normalizeText(message);
  if (!m) return;

  const rules: Array<{ topic: string; patterns: RegExp[]; weight?: number }> = [
    { topic: '运动视频', patterns: [/视频/, /跟练/, /课程/, /教程/, /动作片段/], weight: 1.7 },
    { topic: '跟练', patterns: [/跟练/, /边看边练/, /带着练/], weight: 1.6 },
    { topic: '早餐', patterns: [/早餐/, /早饭/, /晨起/, /早上吃什么/], weight: 1.5 },
    { topic: '晚餐', patterns: [/晚餐/, /晚饭/, /夜宵/, /宵夜/], weight: 1.5 },
    { topic: '快手', patterns: [/快手/, /省事/, /简单做/, /懒人/, /10分钟/, /12分钟/, /15分钟/], weight: 1.4 },
    { topic: '汤类', patterns: [/汤/, /羹/, /炖汤/], weight: 1.2 },
    { topic: '家常', patterns: [/家常/, /下饭/], weight: 1.2 },
    { topic: '拉伸', patterns: [/拉伸/, /伸展/], weight: 1.3 },
    { topic: '办公室', patterns: [/办公室/, /工位/, /开会/, /通勤/], weight: 1.2 },
    { topic: '控糖', patterns: [/血糖/, /糖尿病/, /控糖/, /餐后血糖/, /糖化血红蛋白/, /hba1c/i], weight: 1.4 },
    { topic: '控脂', patterns: [/血脂/, /胆固醇/, /甘油三酯/, /高脂血症/, /低密度/, /ldl/i, /tg/i, /tc/i], weight: 1.4 },
    { topic: '心血管', patterns: [/心血管/, /动脉硬化/, /冠心病/, /心电图/, /心脏/], weight: 1.3 },
    { topic: '低盐', patterns: [/低盐/, /少盐/, /血压/, /高血压/], weight: 1.4 },
    { topic: '血压管理', patterns: [/血压/, /高血压/], weight: 1.4 },
    { topic: '低嘌呤', patterns: [/尿酸/, /痛风/, /关节痛/], weight: 1.4 },
    { topic: '护肝', patterns: [/转氨酶/, /脂肪肝/, /肝功能/, /alt/i, /ast/i], weight: 1.4 },
    { topic: '护肾', patterns: [/肌酐/, /尿蛋白/, /肾功能/, /肾病/, /egfr/i], weight: 1.4 },
    { topic: '减脂', patterns: [/减脂/, /减肥/, /瘦身/, /体重/, /bmi/i, /肥胖/, /超重/], weight: 1.4 },
    { topic: '高蛋白', patterns: [/高蛋白/, /增肌/, /蛋白质/], weight: 1.2 },
    { topic: '高纤维', patterns: [/高纤维/, /膳食纤维/, /便秘/], weight: 1.2 },
    { topic: '清淡', patterns: [/清淡/, /少油/, /易消化/], weight: 1.2 },
    { topic: '养胃', patterns: [/胃胀/, /胃痛/, /胃不好/, /反酸/, /养胃/, /消化不良/, /腹痛/], weight: 1.3 },
    { topic: '素食', patterns: [/素食/, /吃素/], weight: 1.2 },
    { topic: '均衡营养', patterns: [/均衡/, /营养均衡/], weight: 1.1 },
    { topic: '恢复', patterns: [/术后/, /手术/, /切除术/, /康复/, /恢复期/], weight: 1.4 },
    { topic: '高蛋白', patterns: [/术后/, /手术/, /切除术/, /康复/, /白细胞/, /免疫力/, /抵抗力/], weight: 1.2 },
    { topic: '护肝', patterns: [/肝切除/, /肝叶切除/, /肝脏手术/], weight: 1.4 },
    { topic: '均衡营养', patterns: [/白细胞/, /免疫力/, /抵抗力/], weight: 1.2 },
    { topic: '清淡', patterns: [/炎症/, /发炎/, /抗生素/, /用药/], weight: 1.1 },
    { topic: '番茄鸡蛋', patterns: [/(西红柿|番茄).*(鸡蛋)|(鸡蛋).*(西红柿|番茄)/], weight: 1.3 },
    { topic: '脖子抽筋', patterns: [/脖子抽筋/, /颈部抽筋/, /脖子僵住/, /落枕/, /扭到脖子/], weight: 1.3 },
    { topic: '久坐', patterns: [/久坐/, /坐太久/, /长期坐着/, /伏案/, /电脑前/, /办公室/], weight: 1.2 },
    { topic: '肩颈', patterns: [/肩颈/, /脖子酸/, /颈椎/, /低头族/, /斜方肌/, /肩膀僵硬/], weight: 1.3 },
    { topic: '腰背', patterns: [/腰背/, /腰酸背痛/, /下背/, /腰椎/, /腰部僵硬/], weight: 1.3 },
    { topic: '短时动作', patterns: [/没时间/, /碎片时间/, /快速/, /动作片段/, /短视频/, /10秒/, /20秒/, /30秒/], weight: 1.1 },
    { topic: '新手友好', patterns: [/新手/, /初学/, /刚开始/], weight: 1.1 },
    { topic: '恢复', patterns: [/放松/, /舒缓/, /恢复/, /拉伸/], weight: 1.1 },
    { topic: '助眠', patterns: [/失眠/, /睡不着/, /入睡/, /睡眠/], weight: 1.5 },
    { topic: '减压', patterns: [/压力/, /焦虑/, /紧张/, /情绪/, /抑郁/], weight: 1.5 },
  ];

  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(m))) {
      addTopic(signals, rule.topic, '用户提问', rule.weight ?? 1);
    }
  }
}

function extractTopicsFromProfile(
  profile: RecommendationOptions['profile'],
  signals: RecommendationSignals
): void {
  if (!profile) return;

  const diseases = profile.chronicDisease ?? [];
  for (const raw of diseases) {
    const disease = String(raw || '').trim();
    if (!disease) continue;
    if (disease.includes('高血压')) {
      addTopic(signals, '低盐', '健康档案：高血压', 3.4);
      addTopic(signals, '血压管理', '健康档案：高血压', 3.4);
      addTopic(signals, '血压友好', '健康档案：高血压', 2.2);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
    if (disease.includes('糖尿病')) {
      addTopic(signals, '控糖', '健康档案：糖尿病', 3.6);
      addTopic(signals, '高纤维', '健康档案：糖尿病', 2.2);
    }
    if (disease.includes('高脂') || disease.includes('高血脂')) {
      addTopic(signals, '控脂', '健康档案：血脂异常', 3.6);
      addTopic(signals, '心血管', '健康档案：血脂异常', 2.4);
    }
    if (disease.includes('心血管')) {
      addTopic(signals, '心血管', `健康档案：${disease}`, 3.6);
      addTopic(signals, '低盐', `健康档案：${disease}`, 2.4);
      addTopic(signals, '血压友好', `健康档案：${disease}`, 2.2);
      lowerExerciseMaxIntensity(signals, 'low');
    }
    if (disease.includes('冠心病')) {
      addTopic(signals, '心血管', '健康档案：冠心病', 3.8);
      addTopic(signals, '低盐', '健康档案：冠心病', 2.4);
      addTopic(signals, '血压友好', '健康档案：冠心病', 2.2);
      lowerExerciseMaxIntensity(signals, 'low');
    }
    if (disease.includes('痛风')) addTopic(signals, '低嘌呤', '健康档案：痛风', 3.6);
    if (disease.includes('脂肪肝')) {
      addTopic(signals, '护肝', '健康档案：脂肪肝', 3.6);
      addTopic(signals, '控脂', '健康档案：脂肪肝', 2.4);
    }
    if (disease.includes('肾')) {
      addTopic(signals, '护肾', `健康档案：${disease}`, 3.6);
      addTopic(signals, '清淡', `健康档案：${disease}`, 2.0);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
    if (disease.includes('胃溃疡') || disease.includes('胃炎')) {
      addTopic(signals, '养胃', `健康档案：${disease}`, 3.0);
      addTopic(signals, '清淡', `健康档案：${disease}`, 2.6);
    }
    if (disease.includes('幽门螺杆菌')) {
      addTopic(signals, '养胃', `健康档案：${disease}`, 3.2);
      addTopic(signals, '清淡', `健康档案：${disease}`, 2.0);
    }
    if (disease.includes('甲状腺')) {
      addTopic(signals, '恢复', `健康档案：${disease}`, 1.6);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
    if (disease.includes('脑血管')) {
      addTopic(signals, '心血管', `健康档案：${disease}`, 3.2);
      addTopic(signals, '低盐', `健康档案：${disease}`, 2.2);
      addTopic(signals, '控脂', `健康档案：${disease}`, 2.4);
      lowerExerciseMaxIntensity(signals, 'low');
    }
    if (disease.includes('贫血')) {
      addTopic(signals, '恢复', `健康档案：${disease}`, 2.4);
      addTopic(signals, '高蛋白', `健康档案：${disease}`, 1.8);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
    if (disease.includes('哮喘')) {
      addTopic(signals, '恢复', '健康档案：哮喘', 2.4);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
  }

  extractTopicsFromTextEntries(
    profile.symptoms,
    signals,
    [
      { pattern: /失眠|睡不着|早醒|多梦|睡眠浅|熬夜/, topics: [{ topic: '助眠', weight: 3.3 }, { topic: '恢复', weight: 2.1 }] },
      { pattern: /压力|焦虑|紧张|烦躁|情绪低落|抑郁/, topics: [{ topic: '减压', weight: 3.3 }] },
      { pattern: /肩颈|脖子酸|颈椎|低头|肩膀僵|斜方肌/, topics: [{ topic: '肩颈', weight: 3.1 }, { topic: '恢复', weight: 1.6 }] },
      { pattern: /腰酸|腰背|下背|腰椎|背痛/, topics: [{ topic: '腰背', weight: 3.1 }, { topic: '恢复', weight: 1.6 }] },
      { pattern: /久坐|伏案|电脑|办公室/, topics: [{ topic: '久坐', weight: 2.6 }, { topic: '短时动作', weight: 1.6 }] },
      { pattern: /胃胀|反酸|胃痛|胃不舒服|消化不良|腹胀/, topics: [{ topic: '养胃', weight: 3.0 }, { topic: '清淡', weight: 2.2 }] },
      { pattern: /乏力|疲劳|没精神|易累/, topics: [{ topic: '恢复', weight: 2.8 }, { topic: '高蛋白', weight: 1.8 }] },
      { pattern: /便秘/, topics: [{ topic: '高纤维', weight: 2.8 }, { topic: '清淡', weight: 1.4 }] },
      { pattern: /胸闷|心悸|心慌/, topics: [{ topic: '心血管', weight: 2.8 }, { topic: '恢复', weight: 1.8 }] },
    ],
    '健康档案'
  );

  extractTopicsFromTextEntries(
    profile.healthGoals,
    signals,
    [
      { pattern: /减脂|减重|减肥|瘦身/, topics: [{ topic: '减脂', weight: 3.4 }] },
      { pattern: /控糖|降糖|稳糖/, topics: [{ topic: '控糖', weight: 3.4 }] },
      { pattern: /控脂|降脂|血脂/, topics: [{ topic: '控脂', weight: 3.4 }] },
      { pattern: /降压|血压/, topics: [{ topic: '低盐', weight: 3.0 }, { topic: '血压管理', weight: 3.0 }] },
      { pattern: /睡眠|早睡|助眠/, topics: [{ topic: '助眠', weight: 3.2 }] },
      { pattern: /减压|放松|情绪/, topics: [{ topic: '减压', weight: 3.2 }] },
      { pattern: /增肌|力量/, topics: [{ topic: '高蛋白', weight: 2.8 }] },
      { pattern: /养胃|胃|幽门螺杆菌/, topics: [{ topic: '养胃', weight: 2.8 }, { topic: '清淡', weight: 1.8 }] },
      { pattern: /肝/, topics: [{ topic: '护肝', weight: 2.8 }] },
      { pattern: /肾/, topics: [{ topic: '护肾', weight: 2.8 }] },
      { pattern: /心脏|心血管|脑血管/, topics: [{ topic: '心血管', weight: 2.8 }, { topic: '低盐', weight: 2.2 }] },
      { pattern: /肩颈/, topics: [{ topic: '肩颈', weight: 2.8 }] },
      { pattern: /腰背/, topics: [{ topic: '腰背', weight: 2.8 }] },
      { pattern: /恢复|调理/, topics: [{ topic: '恢复', weight: 2.2 }] },
    ],
    '健康目标'
  );

  if (profile.dietHabit === '清淡') {
    addTopic(signals, '清淡', '生活习惯：清淡饮食', 2.6);
    addTopic(signals, '低盐', '生活习惯：清淡饮食', 1.5);
  } else if (profile.dietHabit === '辣') {
    addTopic(signals, '清淡', '生活习惯：喜辣', 1.4);
  } else if (profile.dietHabit === '油腻') {
    addTopic(signals, '控脂', '生活习惯：喜油腻', 2.8);
    addTopic(signals, '清淡', '生活习惯：喜油腻', 2.0);
  } else if (profile.dietHabit === '素食') {
    addTopic(signals, '素食', '生活习惯：素食', 3.0);
    addTopic(signals, '均衡营养', '生活习惯：素食', 1.8);
  } else if (profile.dietHabit === '均衡') {
    addTopic(signals, '均衡营养', '生活习惯：均衡饮食', 2.6);
  }

  if (profile.sleepInfo === '<6') {
    addTopic(signals, '助眠', '生活习惯：睡眠不足', 3.2);
    addTopic(signals, '恢复', '生活习惯：睡眠不足', 2.2);
    lowerExerciseMaxIntensity(signals, 'medium');
  } else if (profile.sleepInfo === '6-7') {
    addTopic(signals, '助眠', '生活习惯：睡眠偏少', 1.8);
  }

  if (profile.exerciseHabit === '从不') {
    addTopic(signals, '低强度', '生活习惯：几乎不运动', 2.8);
    addTopic(signals, '新手友好', '生活习惯：几乎不运动', 2.8);
    addTopic(signals, '恢复', '生活习惯：几乎不运动', 1.8);
    lowerExerciseMaxIntensity(signals, 'low');
  } else if (profile.exerciseHabit === '偶尔') {
    addTopic(signals, '新手友好', '生活习惯：运动较少', 1.8);
    lowerExerciseMaxIntensity(signals, 'medium');
  }

  if (typeof profile.age === 'number' && Number.isFinite(profile.age)) {
    if (profile.age >= 70) {
      addTopic(signals, '恢复', `年龄：${profile.age}岁`, 2.2);
      addTopic(signals, '低强度', `年龄：${profile.age}岁`, 2.0);
      lowerExerciseMaxIntensity(signals, 'low');
    } else if (profile.age >= 60) {
      addTopic(signals, '恢复', `年龄：${profile.age}岁`, 1.4);
      lowerExerciseMaxIntensity(signals, 'medium');
    }
  }

  if (profile.constitutionType) {
    const constitution = String(profile.constitutionType).trim();
    if (constitution) {
      if (/湿热|痰湿/.test(constitution)) {
        addTopic(signals, '清淡', `体质信息：${constitution}`, 1.8);
      }
      if (/气虚|阳虚/.test(constitution)) {
        addTopic(signals, '恢复', `体质信息：${constitution}`, 1.6);
      }
      if (/阴虚/.test(constitution)) {
        addTopic(signals, '助眠', `体质信息：${constitution}`, 1.4);
      }
    }
  }
}

function extractTopicsFromIndicators(
  indicators: ReportIndicator[],
  signals: RecommendationSignals
): {
  hasHypertensionLike: boolean;
  hasHeartRiskLike: boolean;
  hasSeriousAnomaly: boolean;
  matchedTopics: Set<string>;
  exerciseMaxIntensityHint: ExerciseIntensity | null;
} {
  let hasHypertensionLike = false;
  let hasHeartRiskLike = false;
  let hasSeriousAnomaly = false;
  const matchedTopics = new Set<string>();
  let exerciseMaxIntensityHint: ExerciseIntensity | null = null;

  const indicatorRules: Array<{ pattern: RegExp; topics: Array<{ topic: string; weight: number }> }> = [
    {
      pattern: /总胆固醇|胆固醇|\(tc\)|\btc\b/i,
      topics: [{ topic: '控脂', weight: 3.8 }, { topic: '心血管', weight: 3.3 }],
    },
    {
      pattern: /甘油三酯|\(tg\)|\btg\b/i,
      topics: [{ topic: '控脂', weight: 3.8 }, { topic: '心血管', weight: 3.4 }, { topic: '减脂', weight: 3.2 }],
    },
    {
      pattern: /低密度|ldl/i,
      topics: [{ topic: '控脂', weight: 3.8 }, { topic: '心血管', weight: 3.3 }],
    },
    {
      pattern: /高密度|hdl/i,
      topics: [{ topic: '心血管', weight: 3.1 }],
    },
    {
      pattern: /空腹血糖|糖化血红蛋白|hba1c|glu/i,
      topics: [{ topic: '控糖', weight: 3.8 }],
    },
    {
      pattern: /尿酸|\(ua\)|\bua\b/i,
      topics: [{ topic: '低嘌呤', weight: 3.8 }],
    },
    {
      pattern: /谷丙转氨酶|alt|谷草转氨酶|ast|脂肪肝|胆红素|碱性磷酸酶|ggt/i,
      topics: [{ topic: '护肝', weight: 3.8 }],
    },
    {
      pattern: /肌酐|尿素氮|胱抑素|egfr|尿蛋白|尿潜血|尿白细胞/i,
      topics: [{ topic: '护肾', weight: 3.8 }],
    },
    {
      pattern: /血压|收缩压|舒张压|高血压/i,
      topics: [{ topic: '低盐', weight: 3.8 }, { topic: '血压管理', weight: 3.8 }],
    },
    {
      pattern: /体重指数|bmi|超重|肥胖/i,
      topics: [{ topic: '减脂', weight: 3.8 }],
    },
  ];

  const heartRiskPattern = /心电图|t波|st段|早搏|房颤|心肌|冠心病/i;
  const hypertensionPattern = /血压|收缩压|舒张压|高血压/i;

  for (const item of indicators) {
    if (!item || !item.isAnomaly) continue;
    const name = String(item.name || '');
    const value = String(item.value || '');
    const suggestion = String(item.suggestion || '');
    const combined = `${name} ${value} ${suggestion}`;
    const weightBonus = getReportTopicWeightBonus(item.severity);

    if (item.severity === 'serious') {
      hasSeriousAnomaly = true;
    }
    if (hypertensionPattern.test(combined)) hasHypertensionLike = true;
    if (heartRiskPattern.test(combined)) hasHeartRiskLike = true;

    for (const rule of indicatorRules) {
      if (rule.pattern.test(combined)) {
        for (const topicRule of rule.topics) {
          addTopic(signals, topicRule.topic, `报告异常：${name}`, topicRule.weight + weightBonus);
          matchedTopics.add(topicRule.topic);
        }
      }
    }

    const matchedFindingCodes = new Set(matchSpecialFindingRules(item).map((rule) => rule.code));
    for (const reportRule of REPORT_SPECIAL_FINDING_TOPIC_RULES) {
      const isMatched = Array.from(reportRule.codes).some((code) => matchedFindingCodes.has(code));
      if (!isMatched) continue;

      for (const topicRule of reportRule.topics) {
        addTopic(signals, topicRule.topic, `报告异常：${name}`, topicRule.weight + weightBonus);
        matchedTopics.add(topicRule.topic);
      }

      if (reportRule.exerciseCap) {
        exerciseMaxIntensityHint = pickLowerExerciseIntensity(exerciseMaxIntensityHint, reportRule.exerciseCap);
      }
    }
  }

  return { hasHypertensionLike, hasHeartRiskLike, hasSeriousAnomaly, matchedTopics, exerciseMaxIntensityHint };
}

function bridgeReportTopicsToContentSignals(
  signals: RecommendationSignals,
  reportTopics: Set<string>
): void {
  for (const rule of REPORT_EXERCISE_BRIDGE_RULES) {
    const matchedSources = rule.from.filter((topic) => reportTopics.has(topic));
    if (matchedSources.length === 0) continue;

    const evidence = `报告建议：${matchedSources[0]}`;
    for (const next of rule.topics) {
      addTopic(signals, next.topic, evidence, next.weight);
    }
  }
}

function pickLowerExerciseIntensity(
  current: ExerciseIntensity | null,
  next: ExerciseIntensity
): ExerciseIntensity {
  if (!current) return next;
  return EXERCISE_INTENSITY_RANK[next] < EXERCISE_INTENSITY_RANK[current] ? next : current;
}

function getReportTopicWeightBonus(severity: ReportIndicator['severity']): number {
  if (severity === 'serious') return 0.9;
  if (severity === 'abnormal') return 0.5;
  if (severity === 'slight') return 0.2;
  return 0;
}

function matchSpecialFindingRules(indicator: ReportIndicator): SpecialFindingRule[] {
  const source = String(indicator?.name || '').trim();
  if (!source) return [];

  const normalizedSource = normalizeSearchableText(source);
  return SPECIAL_FINDING_LIBRARY.filter((rule) => {
    const normalizedDisplayName = normalizeSearchableText(rule.displayName);
    if (normalizedDisplayName && normalizedSource.includes(normalizedDisplayName)) {
      return true;
    }
    return rule.aliases.some((alias) => alias.test(source));
  });
}

function isValidHealthReport(report: HealthReport | null | undefined): report is HealthReport {
  if (!report) return false;
  if (report.status !== 'parsed') return false;
  const indicators = Array.isArray(report.indicators) ? report.indicators : [];
  if (indicators.length === 0) return false;
  const hasParseFailure = indicators.some((i) => {
    const name = String(i?.name || '');
    return name.startsWith('⚠️') || name.includes('请上传') || name.includes('解析失败') || name.includes('未找到');
  });
  return !hasParseFailure;
}

export class RecommendationService {
  private readonly recommendationHistoryByKey = new Map<string, string[]>();
  private readonly recommendationCursorByKey = new Map<string, number>();

  async getRecommendations(
    scene: string,
    options: RecommendationOptions = {}
  ): Promise<{
    contents: Content[];
    goods: Product[];
    pages: Page[];
  }> {
    const signals = await this.buildSignals(scene, options);
    const contents = this.selectContents(scene, signals, options.userId);
    const goods = this.getGoodsByScene(scene, signals);
    const pages = this.getPagesByScene(scene, signals);

    return {
      contents,
      goods,
      pages,
    };
  }

  // Backward-compatible sync API (no report fetch; message/profile optional).
  getRecommendationsSync(
    scene: string,
    userId?: string,
    message: string = ''
  ): {
    contents: Content[];
    goods: Product[];
    pages: Page[];
  } {
    const signals: RecommendationSignals = {
      topics: new Set<string>(),
      topicEvidence: new Map<string, Set<string>>(),
      topicWeights: new Map<string, number>(),
      exerciseMaxIntensity: 'high',
      pantryQuery: null,
      hasProfile: false,
    };
    extractTopicsFromMessage(message, signals);
    signals.pantryQuery = buildPantryQueryResult(message);
    if (signals.pantryQuery.isPantryQuery) {
      addTopic(signals, '饮食', '食材提问', 2.5);
    }
    if (userId) {
      const profile = getEffectiveHealthProfile(userId);
      signals.hasProfile = hasMeaningfulProfile(profile);
      extractTopicsFromProfile(profile, signals);
    }

    const contents = this.selectContents(scene, signals, userId);
    const goods = this.getGoodsByScene(scene, signals);
    const pages = this.getPagesByScene(scene, signals);

    return { contents, goods, pages };
  }

  private async buildSignals(scene: string, options: RecommendationOptions): Promise<RecommendationSignals> {
    const signals: RecommendationSignals = {
      topics: new Set<string>(),
      topicEvidence: new Map<string, Set<string>>(),
      topicWeights: new Map<string, number>(),
      exerciseMaxIntensity: 'high',
      pantryQuery: null,
      hasProfile: false,
    };

    const message = options.message ?? '';
    extractTopicsFromMessage(message, signals);
    signals.pantryQuery = buildPantryQueryResult(message);
    if (signals.pantryQuery.isPantryQuery) {
      addTopic(signals, '饮食', '食材提问', 2.5);
    }

    const baseProfile =
      options.profile !== undefined
        ? options.profile
        : options.userId
          ? getEffectiveHealthProfile(options.userId)
          : null;

    let report: HealthReport | null = options.report ?? null;
    if (!report && options.userId) {
      try {
        const history = await reportService.getReportHistory(options.userId, 1, 1);
        report = history.length > 0 ? history[0] : null;
      } catch {
        report = null;
      }
    }

    const reportDerivedProfile = buildProfileFromReport(report);
    const profile = mergeHealthProfiles(baseProfile, reportDerivedProfile);
    signals.hasProfile = hasMeaningfulProfile(profile);
    extractTopicsFromProfile(profile, signals);

    if (isValidHealthReport(report)) {
      signals.reportId = report.id;
      const anomalyIndicators = report.indicators.filter((i) => i && i.isAnomaly);
      const { hasHypertensionLike, hasHeartRiskLike, hasSeriousAnomaly, matchedTopics, exerciseMaxIntensityHint } = extractTopicsFromIndicators(
        anomalyIndicators,
        signals
      );

      if (matchedTopics.size > 0) {
        bridgeReportTopicsToContentSignals(signals, matchedTopics);
      }

      if (hasHeartRiskLike) {
        addTopic(signals, '血压友好', '报告建议：心电图风险', 2.4);
        addTopic(signals, '低强度', '报告建议：心电图风险', 2.4);
        addTopic(signals, '新手友好', '报告建议：心电图风险', 1.2);
      } else if (hasHypertensionLike) {
        addTopic(signals, '血压友好', '报告建议：血压管理', 2.2);
        addTopic(signals, '低强度', '报告建议：血压管理', 1.8);
      }

      // Exercise safety heuristics: keep conservative defaults when report suggests risk.
      if (hasHeartRiskLike || hasSeriousAnomaly) {
        lowerExerciseMaxIntensity(signals, 'low');
      } else if (exerciseMaxIntensityHint) {
        lowerExerciseMaxIntensity(signals, exerciseMaxIntensityHint);
      }

      if (
        hasHypertensionLike ||
        Array.from(matchedTopics).some((topic) => REPORT_CONSERVATIVE_EXERCISE_TOPICS.has(topic))
      ) {
        lowerExerciseMaxIntensity(signals, 'medium');
      }
    }

    // Scene fallback: if no topics, use scene as implicit intent.
    if (signals.topics.size === 0) {
      if (scene === 'diet') addTopic(signals, '饮食', '场景默认', 0.8);
      if (scene === 'exercise') addTopic(signals, '运动', '场景默认', 0.8);
      if (scene === 'sleep') addTopic(signals, '助眠', '场景默认', 0.8);
      if (scene === 'psychology') addTopic(signals, '减压', '场景默认', 0.8);
    }

    return signals;
  }

  private getPreferredContentTypes(scene: string, signals: RecommendationSignals): ContentType[] {
    const hasReport = Boolean(signals.reportId);
    if (scene === 'diet') return hasReport ? ['recipe', 'exercise'] : ['recipe'];
    if (scene === 'exercise') return hasReport ? ['exercise', 'recipe'] : ['exercise'];
    if (scene === 'report') return ['recipe', 'exercise'];
    if (scene === 'sleep') return ['sleep', 'exercise'];
    if (scene === 'psychology') return ['psychology', 'exercise'];
    if (scene === 'antiaging') return ['exercise', 'recipe'];

    const topics = signals.topics;
    if (topics.has('运动视频') || topics.has('跟练') || topics.has('拉伸')) return ['exercise', 'recipe', 'sleep'];
    if (topics.has('早餐') || topics.has('晚餐') || topics.has('快手') || topics.has('汤类') || topics.has('家常')) {
      return ['recipe', 'exercise', 'sleep'];
    }
    if (topics.has('助眠')) return ['sleep', 'exercise', 'recipe'];
    if (topics.has('减压')) return ['psychology', 'exercise', 'sleep'];
    if (
      topics.has('肩颈') ||
      topics.has('腰背') ||
      topics.has('久坐') ||
      topics.has('脖子抽筋') ||
      topics.has('短时动作')
    ) {
      return ['exercise', 'recipe', 'sleep'];
    }
    if (
      topics.has('控糖') ||
      topics.has('控脂') ||
      topics.has('低盐') ||
      topics.has('血压管理') ||
      topics.has('低嘌呤') ||
      topics.has('护肝') ||
      topics.has('护肾') ||
      topics.has('减脂') ||
      topics.has('高蛋白') ||
      topics.has('高纤维') ||
      topics.has('清淡') ||
      topics.has('养胃') ||
      topics.has('素食') ||
      topics.has('均衡营养')
    ) {
      return ['recipe', 'exercise', 'sleep'];
    }
    return ['recipe', 'exercise', 'sleep', 'psychology'];
  }

  private scoreContent(
    content: Omit<Content, 'reason'>,
    preferredTypes: ContentType[],
    signals: RecommendationSignals
  ): { score: number; matchedTopics: string[] } {
    let score = 0;
    const matchedTopicSet = new Set<string>();
    const searchText = buildContentSearchText(content);

    const typeIndex = preferredTypes.indexOf(content.type);
    if (typeIndex >= 0) {
      score += Math.max(0, 6 - typeIndex * 2);
    }

    for (const tag of content.tags) {
      const topicWeight = signals.topicWeights.get(tag);
      if (topicWeight) {
        score += 2 + Math.min(4, topicWeight);
        matchedTopicSet.add(tag);
      }
    }

    for (const [topic, weight] of signals.topicWeights.entries()) {
      if (matchedTopicSet.has(topic)) continue;
      const aliases = TOPIC_CONTENT_ALIASES[topic] ?? [topic];
      const hasAliasMatch = aliases.some((alias) => {
        const normalizedAlias = normalizeSearchableText(alias);
        return normalizedAlias && searchText.includes(normalizedAlias);
      });
      if (!hasAliasMatch) continue;

      score += 1.4 + Math.min(3.6, weight * 0.9);
      matchedTopicSet.add(topic);
    }

    // Exercise safety filtering
    if (content.type === 'exercise' && content.intensity) {
      if (EXERCISE_INTENSITY_RANK[content.intensity] > EXERCISE_INTENSITY_RANK[signals.exerciseMaxIntensity]) {
        return { score: -9999, matchedTopics: Array.from(matchedTopicSet) };
      }
    }

    // Prefer items with explicit BVID when user intents include videos
    if (content.type === 'exercise' && content.bvid) score += 1;
    if (signals.topics.has('运动视频') && content.type === 'exercise') {
      score += content.bvid ? 4.4 : 2.6;
      matchedTopicSet.add('运动视频');
    }
    if (signals.topics.has('跟练') && content.type === 'exercise') {
      score += content.bvid ? 2.8 : 1.2;
      matchedTopicSet.add('跟练');
    }
    if (signals.topics.has('早餐') && content.type === 'recipe' && searchText.includes('早餐')) {
      score += 2.8;
      matchedTopicSet.add('早餐');
    }
    if (signals.topics.has('晚餐') && content.type === 'recipe' && (searchText.includes('晚餐') || searchText.includes('清淡') || searchText.includes('汤'))) {
      score += 2.4;
      matchedTopicSet.add('晚餐');
    }
    if (signals.topics.has('快手') && content.type === 'recipe' && (searchText.includes('快手') || searchText.includes('10分钟') || searchText.includes('15分钟'))) {
      score += 2.2;
      matchedTopicSet.add('快手');
    }

    if (matchedTopicSet.size === 0 && signals.topics.size > 0) {
      score -= 1.2;
    }

    return {
      score,
      matchedTopics: Array.from(matchedTopicSet).sort(
        (a, b) => (signals.topicWeights.get(b) ?? 0) - (signals.topicWeights.get(a) ?? 0)
      ),
    };
  }

  private buildReason(
    content: Omit<Content, 'reason'>,
    matchedTopics: string[],
    signals: RecommendationSignals,
    fallback: string,
    scene: string
  ): string {
    const picked = sortTopicsForPresentation(matchedTopics, signals, scene).slice(0, 2);
    const evidenceLabels = Array.from(
      new Set(
        picked.flatMap((topic) =>
          Array.from(signals.topicEvidence.get(topic) ?? [])
            .map(compactEvidenceLabel)
            .filter(Boolean)
        )
      )
    ).slice(0, 2);

    const basis = evidenceLabels.length > 0
      ? evidenceLabels.join('、')
      : picked.length > 0
        ? picked.join('、')
        : signals.reportId
          ? '体检结果'
          : signals.hasProfile
            ? '健康档案'
            : '当前提问';
    const direction = picked.length > 0 ? picked.join(' / ') : '';

    if (content.type === 'recipe') {
      const focusTags = content.tags
        .filter((tag) => ['控糖', '控脂', '低盐', '低嘌呤', '护肝', '护肾', '高蛋白', '高纤维', '清淡', '养胃', '早餐', '晚餐', '快手'].includes(tag))
        .slice(0, 2);
      const directionText = focusTags.length > 0
        ? focusTags.join(' / ')
        : direction || '日常饮食管理';
      return `匹配依据：${basis}；推荐方向：${directionText}`;
    }

    if (content.type === 'exercise') {
      const intensityLabel = content.intensity === 'high'
        ? '高强度'
        : content.intensity === 'medium'
          ? '中等强度'
          : '低强度';
      const durationLabel = Number.isFinite(Number(content.durationSeconds)) && Number(content.durationSeconds) > 0
        ? `${Math.round(Number(content.durationSeconds))}秒`
        : Number.isFinite(Number(content.duration)) && Number(content.duration) > 0
          ? `${Math.round(Number(content.duration))}分钟`
          : '';
      const videoLabel = content.bvid ? '视频跟练' : '动作建议';
      const suffix = [intensityLabel, durationLabel, videoLabel].filter(Boolean).join(' / ');
      return `匹配依据：${basis}；建议先做${suffix || direction || '当前更稳妥的训练'}`;
    }

    if (evidenceLabels.length > 0 && direction) {
      return `匹配依据：${basis}；推荐方向：${direction}`;
    }

    return fallback;
  }

  private resolveContentUrl(content: Omit<Content, 'reason'>): string | undefined {
    if (content.type === 'recipe') {
      const params = new URLSearchParams();
      params.set('recipeId', content.id);
      params.set('recipeTitle', content.title);
      params.set('recipeDesc', content.description);
      if (typeof content.calories === 'number') {
        params.set('recipeCalories', String(content.calories));
      }
      if (Array.isArray(content.tags) && content.tags.length > 0) {
        params.set('recipeTags', content.tags.join(','));
      }
      return `/pages/recipe/list.html?${params.toString()}`;
    }

    if (content.type === 'exercise' && content.bvid) {
      const params = new URLSearchParams();
      params.set('bvid', content.bvid);
      params.set('contentId', content.id);

      const clipSeconds = Number(content.durationSeconds);
      if (Number.isFinite(clipSeconds) && clipSeconds > 0 && clipSeconds <= 120) {
        params.set('isMicro', '1');
        params.set('clipSeconds', String(Math.round(clipSeconds)));
      }

      return `/pages/exercise/list.html?${params.toString()}`;
    }

    return content.url;
  }

  private withResolvedUrl(content: Omit<Content, 'reason'>): Omit<Content, 'reason'> {
    return {
      ...content,
      url: this.resolveContentUrl(content),
    };
  }

  private buildPantryContents(query: PantryQueryResult | null): Content[] {
    if (!query || !query.isPantryQuery) return [];

    const combined = [
      ...query.full.map((item) => ({ item, direct: true })),
      ...query.partial.map((item) => ({ item, direct: false })),
    ];

    return combined.slice(0, 6).map(({ item, direct }) => ({
      id: item.id,
      type: 'recipe',
      title: item.name,
      description: direct
        ? `${item.highlight} 当前食材可直接做。`
        : `${item.highlight} 再补 ${item.missing.join('、')} 更合适。`,
      time: item.time,
      tags: Array.from(new Set([...(item.tags || []), ...(item.ingredients || [])])).slice(0, 6),
      reason: direct ? '匹配依据：你现有食材已齐；推荐方向：优先做快手家常菜' : '匹配依据：现有食材已命中主料；推荐方向：补齐辅料后更稳妥',
      url: this.resolveContentUrl({
        id: item.id,
        type: 'recipe',
        title: item.name,
        description: direct
          ? `${item.highlight} 当前食材可直接做。`
          : `${item.highlight} 再补 ${item.missing.join('、')} 更合适。`,
        time: item.time,
        tags: Array.from(new Set([...(item.tags || []), ...(item.ingredients || [])])).slice(0, 6),
      }),
    }));
  }

  private buildDiversityKey(scene: string, signals: RecommendationSignals, userId?: string): string {
    const identity = String(userId || '').trim();
    if (identity) return `${scene}:user:${identity}`;

    const topTopics = Array.from(signals.topicWeights.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic)
      .join('|');
    return `${scene}:anonymous:${topTopics || 'general'}`;
  }

  private getRecentRecommendationIds(diversityKey: string): Set<string> {
    return new Set(this.recommendationHistoryByKey.get(diversityKey) ?? []);
  }

  private rememberRecommendationIds(diversityKey: string, ids: string[]): void {
    if (ids.length === 0) return;

    const previous = this.recommendationHistoryByKey.get(diversityKey) ?? [];
    const merged = Array.from(new Set([...ids, ...previous])).slice(0, DIVERSITY_HISTORY_LIMIT);
    this.recommendationHistoryByKey.set(diversityKey, merged);
  }

  private takeFromPoolWithCursor(
    pool: RankedContentCandidate[],
    count: number,
    cursorKey: string,
    seenIds: Set<string>,
    selected: RankedContentCandidate[]
  ): number {
    if (count <= 0 || pool.length === 0) return 0;

    const baseCursor = this.recommendationCursorByKey.get(cursorKey) ?? 0;
    let cursor = baseCursor % pool.length;
    let scanned = 0;
    let added = 0;

    while (scanned < pool.length && added < count) {
      const candidate = pool[cursor];
      if (!seenIds.has(candidate.content.id)) {
        seenIds.add(candidate.content.id);
        selected.push(candidate);
        added += 1;
      }
      cursor = (cursor + 1) % pool.length;
      scanned += 1;
    }

    this.recommendationCursorByKey.set(cursorKey, baseCursor + Math.max(added, 1));
    return added;
  }

  private pickRankedCandidates(
    ranked: RankedContentCandidate[],
    count: number,
    options: {
      diversityKey: string;
      recentIds: Set<string>;
      seenIds: Set<string>;
      type?: ContentType;
    }
  ): RankedContentCandidate[] {
    if (count <= 0) return [];

    const filtered = ranked.filter(
      (item) => (!options.type || item.content.type === options.type) && !options.seenIds.has(item.content.id)
    );
    if (filtered.length === 0) return [];

    const windowSize = Math.min(filtered.length, Math.max(DIVERSITY_CANDIDATE_WINDOW, count * 5));
    const headPool = filtered.slice(0, windowSize);
    const headPoolIds = new Set(headPool.map((item) => item.content.id));
    const freshPool = headPool.filter((item) => !options.recentIds.has(item.content.id));
    const recycledPool = headPool.filter((item) => options.recentIds.has(item.content.id));
    const tailPool = filtered.filter((item) => !headPoolIds.has(item.content.id));

    const selected: RankedContentCandidate[] = [];
    const keyBase = `${options.diversityKey}:${options.type ?? 'all'}`;

    this.takeFromPoolWithCursor(freshPool, count, `${keyBase}:fresh`, options.seenIds, selected);
    if (selected.length < count) {
      this.takeFromPoolWithCursor(
        recycledPool,
        count - selected.length,
        `${keyBase}:recycled`,
        options.seenIds,
        selected
      );
    }
    if (selected.length < count) {
      this.takeFromPoolWithCursor(tailPool, count - selected.length, `${keyBase}:tail`, options.seenIds, selected);
    }

    return selected;
  }

  private shouldPrioritizeSignatureRecipes(scene: string, signals: RecommendationSignals): boolean {
    if (signals.pantryQuery?.isPantryQuery) return false;
    if (signals.reportId) return false;
    if (
      signals.topics.has('早餐') ||
      signals.topics.has('晚餐') ||
      signals.topics.has('快手') ||
      signals.topics.has('汤类') ||
      signals.topics.has('家常') ||
      signals.topics.has('运动视频') ||
      signals.topics.has('跟练')
    ) {
      return false;
    }
    if (scene === 'diet') return true;
    if (scene !== 'chat' && scene !== 'report') return false;
    return Array.from(SIGNATURE_RECIPE_TRIGGER_TOPICS).some((topic) => signals.topics.has(topic));
  }

  private getSignatureRecipePriority(item: RankedContentCandidate, signals: RecommendationSignals): number {
    const matchedWeight = item.matchedTopics.reduce(
      (total, topic) => total + (signals.topicWeights.get(topic) ?? 0),
      0
    );
    const orderBias = SIGNATURE_RECIPE_ORDER.get(item.content.id) ?? 0;
    return matchedWeight * 10 + item.matchedTopics.length * 4 + item.score + orderBias;
  }

  private pickSignatureRecipes(
    ranked: RankedContentCandidate[],
    count: number,
    seenIds: Set<string>,
    signals: RecommendationSignals
  ): RankedContentCandidate[] {
    if (count <= 0) return [];

    const selected: RankedContentCandidate[] = [];
    const candidates = ranked
      .filter(
        (item) =>
          item.content.type === 'recipe' &&
          SIGNATURE_RECIPE_ORDER.has(item.content.id) &&
          !seenIds.has(item.content.id)
      )
      .sort(
        (a, b) =>
          this.getSignatureRecipePriority(b, signals) - this.getSignatureRecipePriority(a, signals)
      );

    for (const candidate of candidates) {
      if (selected.length >= count) break;
      seenIds.add(candidate.content.id);
      selected.push(candidate);
    }

    return selected;
  }

  private toReasonedContents(
    items: RankedContentCandidate[],
    signals: RecommendationSignals,
    fallbackReason: string,
    scene: string
  ): Content[] {
    return items.map((item) => ({
      ...item.content,
      evidenceBadges: buildEvidenceBadges(item.matchedTopics, signals, scene),
      reason: this.buildReason(item.content, item.matchedTopics, signals, fallbackReason, scene),
    }));
  }

  private selectContents(scene: string, signals: RecommendationSignals, userId?: string): Content[] {
    const hasReport = Boolean(signals.reportId);
    const pantryContents = this.buildPantryContents(signals.pantryQuery);
    if (pantryContents.length > 0) {
      return pantryContents.slice(0, 3);
    }

    const hasPersonalSignal = hasReport || signals.hasProfile || signals.topicWeights.size > 0;
    const allowGenericFallback =
      scene === 'chat' ||
      scene === 'diet' ||
      scene === 'exercise' ||
      scene === 'sleep' ||
      scene === 'psychology' ||
      scene === 'antiaging';
    if (!hasPersonalSignal && !allowGenericFallback) {
      return [];
    }

    const preferredTypes = this.getPreferredContentTypes(scene, signals);

    const scored: RankedContentCandidate[] = loadBackendContentCatalog()
      .map((c) => {
        const resolved = this.withResolvedUrl(c);
        const { score, matchedTopics } = this.scoreContent(resolved, preferredTypes, signals);
        return { content: resolved, score, matchedTopics };
      })
      .filter((item) => item.score > -1000)
      .sort((a, b) => b.score - a.score);

    const requireMatchedTopicsOnly =
      !hasReport &&
      !signals.hasProfile &&
      (scene === 'disease' || scene === 'chat' || scene === 'tcm' || scene === 'report');
    const strictlyMatched = scored.filter((item) => item.matchedTopics.length > 0);
    const enforceStrictMatches = hasReport || requireMatchedTopicsOnly;
    const ranked = hasReport
      ? (strictlyMatched.length > 0 ? strictlyMatched : scored)
      : enforceStrictMatches
        ? strictlyMatched.length >= 8
          ? strictlyMatched
          : scored
        : scored;
    if (ranked.length === 0) {
      return [];
    }

    const wantMix =
      scene === 'report' ||
      hasReport ||
      signals.topics.has('控糖') ||
      signals.topics.has('控脂') ||
      signals.topics.has('减脂');

    const personalizedFallback = signals.reportId
      ? '结合你的体检情况推荐'
      : signals.hasProfile
        ? '结合你的健康档案推荐'
        : '结合你的提问推荐';

    const diversityKey = this.buildDiversityKey(scene, signals, userId);
    const recentIds = this.getRecentRecommendationIds(diversityKey);
    const seen = new Set<string>();
    const prioritizeSignatureRecipes = this.shouldPrioritizeSignatureRecipes(scene, signals);

    const pickedCandidates = (() => {
      if (!wantMix) {
        const signature = prioritizeSignatureRecipes
          ? this.pickSignatureRecipes(ranked, 3, seen, signals)
          : [];
        const remainder =
          signature.length < 3
            ? this.pickRankedCandidates(ranked, 3 - signature.length, {
                diversityKey,
                recentIds,
                seenIds: seen,
              })
            : [];
        return [...signature, ...remainder].slice(0, 3);
      }

      const preferredPrimary = preferredTypes[0] ?? 'recipe';
      const primaryCount = preferredPrimary === 'exercise' ? 2 : 2;
      const secondaryType: ContentType = preferredPrimary === 'recipe' ? 'exercise' : 'recipe';
      const secondaryCount = 3 - primaryCount;
      const primaryMatchedCount = ranked.filter((item) => item.content.type === preferredPrimary).length;
      const secondaryMatchedCount = ranked.filter((item) => item.content.type === secondaryType).length;
      const primarySource =
        hasReport
          ? ranked
          : requireMatchedTopicsOnly && primaryMatchedCount < Math.max(primaryCount, 2)
            ? scored
            : ranked;
      const secondarySource =
        hasReport
          ? ranked
          : requireMatchedTopicsOnly && secondaryMatchedCount < 6
            ? scored
            : ranked;

      const primarySignature =
        prioritizeSignatureRecipes && preferredPrimary === 'recipe'
          ? this.pickSignatureRecipes(primarySource, primaryCount, seen, signals)
          : [];
      const primary = [
        ...primarySignature,
        ...this.pickRankedCandidates(primarySource, primaryCount - primarySignature.length, {
          diversityKey,
          recentIds,
          seenIds: seen,
          type: preferredPrimary,
        }),
      ];
      const secondary = this.pickRankedCandidates(secondarySource, secondaryCount, {
        diversityKey,
        recentIds,
        seenIds: seen,
        type: secondaryType,
      });

      const picked = [...primary, ...secondary];
      if (picked.length < 3) {
        const remainder = this.pickRankedCandidates(ranked, 3 - picked.length, {
          diversityKey,
          recentIds,
          seenIds: seen,
        });
        picked.push(...remainder);
      }

      return picked.slice(0, 3);
    })();

    const desired = this.toReasonedContents(pickedCandidates, signals, personalizedFallback, scene);
    const deduped = desired.filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index);

    const hasRecipeRecommendation = deduped.some((item) => item.type === 'recipe');
    if (!hasReport && !hasRecipeRecommendation && deduped.length < 3) {
      const exerciseFallbacks = this.toReasonedContents(
        this.pickRankedCandidates(ranked, 3 - deduped.length, {
          diversityKey,
          recentIds,
          seenIds: seen,
          type: 'exercise',
        }),
        signals,
        personalizedFallback,
        scene
      );
      deduped.push(...exerciseFallbacks);
    }

    const finalContents = deduped.slice(0, 3);
    this.rememberRecommendationIds(diversityKey, finalContents.map((item) => item.id));
    return finalContents;
  }

  private getGoodsByScene(_scene: string, _signals: RecommendationSignals): Product[] {
    return productCatalog.slice(0, 2);
  }

  private getPagesByScene(_scene: string, _signals: RecommendationSignals): Page[] {
    return pageCatalog;
  }

  async getContents(): Promise<Content[]> {
    return loadBackendContentCatalog().map((content) => this.withResolvedUrl(content));
  }

  async getStoredRecipes(): Promise<RecipeCatalogItem[]> {
    return loadStoredRecipes();
  }

  async getStoredExerciseVideos(): Promise<ExerciseCatalogItem[]> {
    return loadStoredExerciseVideos();
  }

  async saveStoredRecipes(items: unknown): Promise<RecipeCatalogItem[]> {
    return replaceStoredRecipes(items);
  }

  async saveStoredExerciseVideos(items: unknown): Promise<ExerciseCatalogItem[]> {
    return replaceStoredExerciseVideos(items);
  }

  async getProducts(): Promise<Product[]> {
    return productCatalog;
  }

  async getPages(): Promise<Page[]> {
    return pageCatalog;
  }
}
