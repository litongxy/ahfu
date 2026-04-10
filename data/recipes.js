const recipes = [
  // 养生汤类 (20道)
  { id: 1, name: "山药枸杞炖鸡汤", desc: "补气养血，健脾益胃，适合气血不足人群", time: "60分钟", cal: 320, type: "汤类", tags: ["补气养血", "健脾"], img: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop", 
    ingredients: ["鸡肉500g", "山药200g", "枸杞15g", "红枣5颗", "姜3片", "盐适量"],
    steps: ["鸡肉洗净切块，焯水备用", "山药去皮切块，枸杞红枣洗净", "锅中加水，放入鸡肉、姜片、红枣", "大火烧开后转小火炖30分钟", "加入山药、枸杞继续炖20分钟", "出锅前加盐调味即可"] },
  
  { id: 2, name: "红枣桂圆粥", desc: "养心安神，补血美容，适合失眠人群", time: "30分钟", cal: 180, type: "汤类", tags: ["养心安神", "美容"], img: "https://images.unsplash.com/photo-1555078604-b2379f0e964a?w=1200&auto=format&fit=crop",
    ingredients: ["大米100g", "红枣10颗", "桂圆15g", "红糖适量"],
    steps: ["大米洗净浸泡30分钟", "红枣去核，桂圆肉洗净", "锅中加水，放入大米煮沸", "加入红枣、桂圆，小火熬煮", "煮至粥稠，加红糖调味"] },
  
  { id: 3, name: "百合莲子银耳羹", desc: "润肺止咳，清心安神，适合熬夜人群", time: "45分钟", cal: 150, type: "汤类", tags: ["润肺", "清心"], img: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400",
    ingredients: ["银耳50g", "百合30g", "莲子30g", "冰糖适量", "枸杞10g"],
    steps: ["银耳提前泡发，撕成小朵", "莲子、百合提前浸泡1小时", "锅中加水，放入银耳煮30分钟", "加入莲子、百合继续煮15分钟", "放入枸杞、冰糖，煮至融化"] },
  
  { id: 4, name: "玉米排骨汤", desc: "补钙养颜，增强免疫力", time: "90分钟", cal: 280, type: "汤类", tags: ["补钙", "养颜"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    ingredients: ["排骨500g", "玉米2根", "胡萝卜1根", "姜3片", "盐适量"],
    steps: ["排骨洗净焯水，玉米切段，胡萝卜切块", "锅中加水，放入排骨、姜片", "大火烧开后撇去浮沫", "加入玉米、胡萝卜，小火炖1小时", "出锅前加盐调味"] },
  
  { id: 5, name: "冬瓜薏米老鸭汤", desc: "清热祛湿，利尿消肿", time: "120分钟", cal: 220, type: "汤类", tags: ["清热", "祛湿"], img: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    ingredients: ["老鸭500g", "冬瓜300g", "薏米50g", "姜3片", "盐适量"],
    steps: ["老鸭洗净切块，焯水备用", "薏米提前浸泡2小时", "锅中加水，放入鸭块、薏米、姜片", "大火烧开后转小火炖1小时", "加入冬瓜继续炖30分钟", "出锅前加盐调味"] },
  
  { id: 6, name: "番茄牛腩汤", desc: "补铁养血，酸甜开胃", time: "90分钟", cal: 350, type: "汤类", tags: ["补铁", "开胃"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    ingredients: ["牛腩500g", "番茄3个", "洋葱1个", "姜3片", "盐适量"],
    steps: ["牛腩切块焯水，番茄切块，洋葱切片", "锅中加油，爆香洋葱、姜片", "放入牛腩翻炒，加水没过食材", "大火烧开后转小火炖1小时", "加入番茄继续炖30分钟", "加盐调味即可"] },
  
  { id: 7, name: "莲藕花生猪骨汤", desc: "补血养颜，润燥清肺", time: "120分钟", cal: 290, type: "汤类", tags: ["补血", "润燥"], img: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=400",
    ingredients: ["猪骨500g", "莲藕300g", "花生50g", "红枣5颗", "姜3片", "盐适量"],
    steps: ["猪骨洗净焯水，莲藕切块，花生浸泡", "锅中加水，放入猪骨、姜片", "大火烧开后转小火炖1小时", "加入莲藕、花生、红枣", "继续炖1小时，加盐调味"] },
  
  { id: 8, name: "党参黄芪炖肉", desc: "补气升阳，益卫固表", time: "60分钟", cal: 310, type: "汤类", tags: ["补气", "益气"], img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400",
    ingredients: ["五花肉500g", "党参30g", "黄芪30g", "姜3片", "盐适量", "料酒1勺"],
    steps: ["五花肉切块，焯水备用", "党参、黄芪洗净", "锅中加水，放入肉块、党参、黄芪、姜片", "加料酒，大火烧开", "转小火炖45分钟，加盐调味"] },
  
  { id: 9, name: "当归生姜羊肉汤", desc: "温中补血，调经止痛", time: "90分钟", cal: 380, type: "汤类", tags: ["温补", "调经"], img: "https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=1200&auto=format&fit=crop",
    ingredients: ["羊肉500g", "当归20g", "生姜50g", "枸杞10g", "盐适量"],
    steps: ["羊肉切块焯水，生姜切片", "锅中加水，放入羊肉、当归、生姜", "大火烧开后撇去浮沫", "转小火炖1小时", "加入枸杞再炖10分钟", "加盐调味即可"] },
  
  { id: 10, name: "天麻鱼头汤", desc: "平肝熄风，祛风止痛", time: "45分钟", cal: 240, type: "汤类", tags: ["平肝", "祛风"], img: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=400",
    ingredients: ["鱼头1个", "天麻20g", "川芎10g", "姜3片", "盐适量", "料酒1勺"],
    steps: ["鱼头洗净，用料酒腌制10分钟", "天麻、川芎洗净备用", "锅中加油，煎香鱼头", "加水，放入天麻、川芎、姜片", "大火烧开后转中火炖30分钟", "加盐调味即可"] },
  
  { id: 11, name: "花胶鸡汤", desc: "滋阴养颜，补充胶原蛋白", time: "120分钟", cal: 420, type: "汤类", tags: ["滋阴", "养颜"], img: "https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=400",
    ingredients: ["鸡1只", "花胶50g", "枸杞15g", "红枣5颗", "姜3片", "盐适量"],
    steps: ["花胶提前泡发12小时", "鸡洗净切块，焯水备用", "锅中加水，放入鸡块、花胶", "加入红枣、姜片，大火烧开", "转小火炖2小时", "加入枸杞再炖10分钟，加盐"] },
  
  { id: 12, name: "海底椰雪梨汤", desc: "清热润肺，止咳化痰", time: "60分钟", cal: 160, type: "汤类", tags: ["清热", "润肺"], img: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400",
    ingredients: ["海底椰30g", "雪梨2个", "南北杏20g", "冰糖适量"],
    steps: ["海底椰、南北杏提前浸泡", "雪梨去皮切块", "锅中加水，放入所有食材", "大火烧开后转小火炖45分钟", "加入冰糖调味"] },
  
  { id: 13, name: "萝卜丝鲫鱼汤", desc: "健脾利湿，和中开胃", time: "40分钟", cal: 200, type: "汤类", tags: ["健脾", "开胃"], img: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=400",
    ingredients: ["鲫鱼2条", "白萝卜1根", "姜3片", "葱1根", "盐适量", "料酒1勺"],
    steps: ["鲫鱼洗净，萝卜切丝", "锅中加油，煎至两面金黄", "加水和姜片，大火烧开", "放入萝卜丝，转中火煮15分钟", "加葱段、盐调味即可"] },
  
  { id: 14, name: "酸菜粉丝汤", desc: "开胃消食，简单易做", time: "20分钟", cal: 150, type: "汤类", tags: ["开胃", "消食"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    ingredients: ["酸菜100g", "粉丝1把", "豆腐100g", "姜2片", "盐适量", "鸡精少许"],
    steps: ["酸菜洗净切丝，粉丝泡软", "锅中加水，放入酸菜、姜片", "水开后放入粉丝、豆腐", "煮5分钟，加盐、鸡精调味"] },
  
  { id: 15, name: "紫菜蛋花汤", desc: "补碘养心，简单营养", time: "10分钟", cal: 80, type: "汤类", tags: ["补碘", "养心"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    ingredients: ["紫菜10g", "鸡蛋2个", "葱1根", "盐适量", "香油少许"],
    steps: ["紫菜泡软，鸡蛋打散", "锅中加水烧开", "放入紫菜煮2分钟", "慢慢倒入蛋液，形成蛋花", "加盐调味，撒葱花，滴香油"] },
  
  { id: 16, name: "豆腐鲫鱼汤", desc: "优质蛋白，健脑益智", time: "30分钟", cal: 190, type: "汤类", tags: ["蛋白", "健脑"], img: "https://images.unsplash.com/photo-1580554530778-ca36943938b2?w=400",
    ingredients: ["鲫鱼2条", "豆腐200g", "姜3片", "葱1根", "盐适量", "料酒1勺"],
    steps: ["鲫鱼洗净，豆腐切块", "锅中加油，煎至鱼身金黄", "加水和姜片，大火烧开", "放入豆腐，中火煮15分钟", "加葱段、盐调味"] },
  
  { id: 17, name: "虫草花炖鸭", desc: "滋补肝肾，增强体质", time: "90分钟", cal: 340, type: "汤类", tags: ["滋补", "肝肾"], img: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    ingredients: ["鸭肉500g", "虫草花30g", "枸杞15g", "姜3片", "盐适量"],
    steps: ["鸭肉切块焯水，虫草花洗净", "锅中加水，放入鸭肉、虫草花", "加姜片，大火烧开", "转小火炖1小时", "加入枸杞再炖10分钟", "加盐调味"] },
  
  { id: 18, name: "木瓜牛奶炖品", desc: "丰满美容，润肠通便", time: "30分钟", cal: 220, type: "汤类", tags: ["美容", "通便"], img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    ingredients: ["木瓜1个", "牛奶500ml", "冰糖适量", "枸杞10g"],
    steps: ["木瓜去皮切块", "锅中加牛奶，放入木瓜", "小火煮15分钟", "加入冰糖、枸杞", "煮至冰糖融化即可"] },
  
  { id: 19, name: "枸杞叶猪肝汤", desc: "补肝明目，养血美容", time: "25分钟", cal: 180, type: "汤类", tags: ["补肝", "明目"], img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400",
    ingredients: ["猪肝200g", "枸杞叶300g", "姜2片", "盐适量", "淀粉1勺"],
    steps: ["猪肝切片，用淀粉腌制", "枸杞叶洗净", "锅中加水，放姜片烧开", "放入猪肝煮至变色", "加入枸杞叶煮2分钟", "加盐调味即可"] },
  
  { id: 20, name: "椰子鸡汤", desc: "清补凉润，滋养心肺", time: "60分钟", cal: 290, type: "汤类", tags: ["清补", "养肺"], img: "https://images.unsplash.com/photo-1567337710282-00832b415979?w=400",
    ingredients: ["椰子1个", "鸡1只", "枸杞15g", "红枣5颗", "盐适量"],
    steps: ["椰子取肉和汁，鸡肉切块焯水", "锅中加椰子水和水", "放入鸡肉、椰肉、红枣", "大火烧开转小火炖1小时", "加入枸杞再炖10分钟", "加盐调味"] },

  // 药膳类 (20道)
  { id: 21, name: "黄芪当归炖鸡", desc: "补气养血，调经美容", time: "90分钟", cal: 320, type: "药膳", tags: ["补气", "养血"], img: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop",
    ingredients: ["鸡1只", "黄芪30g", "当归15g", "红枣5颗", "姜3片", "盐适量"],
    steps: ["鸡洗净切块，焯水备用", "黄芪、当归、红枣洗净", "锅中加水，放入所有食材", "大火烧开转小火炖1小时", "加盐调味"] },
  
  { id: 22, name: "天麻炖猪脑", desc: "补脑益智，镇静安神", time: "60分钟", cal: 280, type: "药膳", tags: ["补脑", "安神"], img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400",
    ingredients: ["猪脑2个", "天麻20g", "枸杞10g", "姜2片", "盐适量", "料酒1勺"],
    steps: ["猪脑洗净，去除血丝", "天麻泡软切片", "锅中加水，放入猪脑、天麻", "加料酒、姜片，炖40分钟", "加入枸杞，加盐调味"] },
  
  { id: 23, name: "枸杞炖鲍鱼", desc: "滋阴补肾，养肝明目", time: "45分钟", cal: 180, type: "药膳", tags: ["滋阴", "补肾"], img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400",
    ingredients: ["鲍鱼5个", "枸杞20g", "姜3片", "盐适量"],
    steps: ["鲍鱼刷净，枸杞洗净", "锅中加水，放入鲍鱼、枸杞", "加姜片，大火烧开", "转小火炖30分钟", "加盐调味"] },
  
  { id: 24, name: "杜仲猪腰汤", desc: "补肾强腰，强壮筋骨", time: "60分钟", cal: 260, type: "药膳", tags: ["补肾", "强腰"], img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400",
    ingredients: ["猪腰2个", "杜仲30g", "枸杞15g", "姜3片", "盐适量", "料酒1勺"],
    steps: ["猪腰切片，用盐水浸泡", "杜仲泡软", "锅中加水，放入杜仲、姜片", "加入猪腰，大火烧开", "转小火炖40分钟", "加入枸杞，加盐"] },
  
  { id: 25, name: "四物炖鸡", desc: "补血调经，美容养颜", time: "90分钟", cal: 340, type: "药膳", tags: ["补血", "调经"], img: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop",
    ingredients: ["鸡1只", "当归15g", "川芎10g", "熟地20g", "白芍15g", "红枣5颗", "盐适量"],
    steps: ["鸡洗净切块焯水", "四物药材洗净", "锅中加水，放入所有食材", "大火烧开转小火炖1小时", "加盐调味"] },
  
  { id: 26, name: "人参炖鸡汤", desc: "大补元气，益血生津", time: "120分钟", cal: 380, type: "药膳", tags: ["大补", "元气"], img: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop",
    ingredients: ["鸡1只", "人参30g", "枸杞20g", "红枣5颗", "姜3片", "盐适量"],
    steps: ["鸡洗净，人参切片", "锅中加水，放入鸡、人参", "加入红枣、姜片", "大火烧开转小火炖2小时", "加入枸杞，加盐"] },
  
  { id: 27, name: "灵芝孢子炖品", desc: "增强免疫，抗疲劳", time: "60分钟", cal: 200, type: "药膳", tags: ["免疫", "抗疲劳"], img: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400",
    ingredients: ["灵芝孢子粉10g", "鸡肉300g", "枸杞15g", "姜3片", "盐适量"],
    steps: ["鸡肉切块焯水", "锅中加水，放入鸡肉、姜片", "炖40分钟后加入孢子粉", "继续炖15分钟", "加入枸杞，加盐"] },
  
  { id: 28, name: "田七炖鸡", desc: "活血化瘀，消肿止痛", time: "60分钟", cal: 310, type: "药膳", tags: ["活血", "化瘀"], img: "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop",
    ingredients: ["鸡1只", "田七20g", "枸杞15g", "红枣5颗", "盐适量"],
    steps: ["鸡洗净切块，田七打碎", "锅中加水，放入鸡、田七", "加入红枣，大火烧开", "转小火炖1小时", "加入枸杞，加盐"] },
  
  { id: 29, name: "五指毛桃汤", desc: "健脾祛湿，补肺益气", time: "90分钟", cal: 240, type: "药膳", tags: ["健脾", "祛湿"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400",
    ingredients: ["五指毛桃50g", "排骨300g", "茯苓20g", "枸杞10g", "盐适量"],
    steps: ["五指毛桃、茯苓提前浸泡", "排骨焯水", "锅中加水，放入所有食材", "大火烧开转小火炖1小时", "加入枸杞，加盐"] },
  
  { id: 30, name: "巴戟天炖排骨", desc: "补肾阳，强筋骨", time: "90分钟", cal: 350, type: "药膳", tags: ["补肾", "强筋"], img: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400",
    ingredients: ["排骨500g", "巴戟天30g", "杜仲20g", "枸杞15g", "盐适量"],
    steps: ["排骨焯水，巴戟天、杜仲洗净", "锅中加水，放入排骨、巴戟天、杜仲", "大火烧开转小火炖1小时", "加入枸杞再炖10分钟", "加盐调味"] },

  // 家常菜类 (30道) - 简化版
  { id: 41, name: "蒜蓉西兰花", desc: "抗癌防癌，富含维C", time: "10分钟", cal: 80, type: "家常菜", tags: ["抗癌", "维C"], img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400",
    ingredients: ["西兰花300g", "蒜末20g", "盐适量", "食用油适量"],
    steps: ["西兰花切小朵，焯水备用", "锅中热油，爆香蒜末", "放入西兰花翻炒", "加盐调味，快速出锅"] },

  { id: 42, name: "番茄炒蛋", desc: "营养家常，维生素丰富", time: "10分钟", cal: 150, type: "家常菜", tags: ["营养", "维C"], img: "https://images.unsplash.com/photo-1759216280661-e785edc3922e?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "鸡蛋3个", "葱花适量", "盐适量", "糖少许"],
    steps: ["番茄切块，鸡蛋打散", "锅中热油，先炒鸡蛋盛出", "再炒番茄，加糖", "放入鸡蛋一起翻炒", "加盐，撒葱花"] },

  { id: 43, name: "青椒土豆丝", desc: "清爽开胃，简单快手", time: "15分钟", cal: 180, type: "家常菜", tags: ["清爽", "快手"], img: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400",
    ingredients: ["土豆1个", "青椒2个", "干辣椒3个", "蒜末适量", "盐醋适量"],
    steps: ["土豆切丝泡水，青椒切丝", "锅中热油，爆香干辣椒蒜末", "放入土豆丝翻炒", "加醋、盐，最后放青椒"] },

  { id: 44, name: "红烧肉", desc: "肥而不腻，入口即化", time: "60分钟", cal: 580, type: "家常菜", tags: ["香浓", "下饭"], img: "https://images.unsplash.com/photo-1740968861052-77a2a89b0c51?w=1200&auto=format&fit=crop",
    ingredients: ["五花肉500g", "冰糖30g", "生抽2勺", "老抽1勺", "八角2个", "桂皮1块"],
    steps: ["五花肉切块焯水", "锅中放冰糖炒色", "放入肉块翻炒上色", "加生抽老抽八角桂皮", "加水没过肉，大火烧开", "转小火炖1小时，收汁"] },

  // 素食类 (15道) - 简化版
  { id: 71, name: "香菇青菜", desc: "清淡爽口，富含维D", time: "8分钟", cal: 70, type: "素食", tags: ["清淡", "维D"], img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400",
    ingredients: ["青菜300g", "香菇5朵", "蒜末适量", "盐适量"],
    steps: ["香菇切片，青菜洗净", "锅中热油，爆香蒜末", "放入香菇翻炒", "加入青菜翻炒", "加盐调味出锅"] },

  { id: 72, name: "蒜蓉油麦菜", desc: "清爽解腻，富含铁", time: "5分钟", cal: 50, type: "素食", tags: ["清爽", "铁"], img: "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400",
    ingredients: ["油麦菜300g", "蒜末20g", "盐适量"],
    steps: ["油麦菜切段", "锅中热油，爆香蒜末", "放入油麦菜翻炒", "加盐，出锅"] },

  // 早餐类 (15道) - 简化版
  { id: 86, name: "牛奶燕麦粥", desc: "营养早餐，富含膳食纤维", time: "10分钟", cal: 200, type: "早餐", tags: ["营养", "纤维"], img: "https://images.unsplash.com/photo-1555078604-b2379f0e964a?w=1200&auto=format&fit=crop",
    ingredients: ["燕麦100g", "牛奶300ml", "蜂蜜适量", "坚果少许"],
    steps: ["燕麦加水煮沸", "倒入牛奶搅拌", "煮3分钟", "加入蜂蜜、坚果"] },

  { id: 87, name: "全麦三明治", desc: "低脂健康，补充能量", time: "10分钟", cal: 280, type: "早餐", tags: ["低脂", "能量"], img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
    ingredients: ["全麦面包2片", "鸡蛋1个", "生菜2片", "番茄2片", "沙拉酱适量"],
    steps: ["鸡蛋煎熟", "面包烤一下", "依次放生菜、番茄、鸡蛋", "挤上沙拉酱", "盖上面包"] },

  { id: 88, name: "西红柿鸡蛋面", desc: "快手一锅面，酸香开胃", time: "15分钟", cal: 360, type: "早餐", tags: ["快手", "开胃"], img: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=1200&auto=format&fit=crop",
    ingredients: ["西红柿2个", "鸡蛋2个", "挂面150g", "葱花适量", "盐适量"],
    steps: ["西红柿切块，鸡蛋打散", "锅中热油炒蛋盛出", "下西红柿炒软后加水", "水开后下面条，煮至八成熟", "放回鸡蛋，加盐调味，撒葱花"] },

  { id: 89, name: "番茄鸡蛋汤", desc: "清爽低负担，晚餐搭配佳", time: "10分钟", cal: 120, type: "汤类", tags: ["清淡", "快手"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "鸡蛋2个", "葱花适量", "盐适量", "香油少许"],
    steps: ["番茄切小块，鸡蛋打散", "锅中加水放番茄煮3分钟", "调入盐后缓慢淋入蛋液", "轻轻推动形成蛋花", "撒葱花，滴香油出锅"] },

  { id: 90, name: "番茄鸡蛋豆腐汤", desc: "补充蛋白，嫩滑鲜香", time: "15分钟", cal: 170, type: "汤类", tags: ["高蛋白", "清淡"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "鸡蛋2个", "嫩豆腐200g", "葱花适量", "盐适量"],
    steps: ["豆腐切小块，番茄切丁", "番茄下锅炒出汁，加水煮开", "加入豆腐煮3分钟", "淋入蛋液形成蛋花", "加盐调味，撒葱花"] },

  { id: 91, name: "番茄鸡蛋盖浇饭", desc: "主食配菜一盘搞定", time: "15分钟", cal: 420, type: "家常菜", tags: ["下饭", "快手"], img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "鸡蛋3个", "米饭1碗", "盐适量", "糖少许"],
    steps: ["鸡蛋打散炒至凝固盛出", "番茄下锅炒软，加盐和少许糖", "放回鸡蛋翻炒均匀", "将番茄鸡蛋浇在热米饭上即可"] },

  { id: 92, name: "木耳炒鸡蛋", desc: "脆嫩可口，营养均衡", time: "12分钟", cal: 190, type: "家常菜", tags: ["营养", "快手"], img: "https://images.unsplash.com/photo-1514516345957-556ca7fd7d82?w=1200&auto=format&fit=crop",
    ingredients: ["泡发木耳120g", "鸡蛋3个", "蒜末适量", "盐适量", "生抽1勺"],
    steps: ["木耳洗净撕小朵，鸡蛋打散", "先炒鸡蛋盛出", "蒜末爆香后下木耳翻炒", "加入鸡蛋、生抽、盐翻匀即可"] },

  { id: 93, name: "洋葱炒鸡蛋", desc: "甜香入味，配饭下饭", time: "10分钟", cal: 180, type: "家常菜", tags: ["下饭", "快手"], img: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=1200&auto=format&fit=crop",
    ingredients: ["洋葱1个", "鸡蛋3个", "盐适量", "生抽1勺"],
    steps: ["洋葱切丝，鸡蛋打散", "鸡蛋炒熟盛出", "洋葱下锅翻炒至微透明", "放入鸡蛋，加盐和生抽翻匀"] },

  { id: 94, name: "黄瓜炒鸡蛋", desc: "清爽家常，口感脆嫩", time: "10分钟", cal: 160, type: "家常菜", tags: ["清爽", "家常"], img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    ingredients: ["黄瓜1根", "鸡蛋3个", "蒜末适量", "盐适量"],
    steps: ["黄瓜切片，鸡蛋打散", "先炒鸡蛋盛出", "蒜末爆香后下黄瓜快炒", "放回鸡蛋，加盐翻匀出锅"] },

  { id: 95, name: "香菇滑蛋", desc: "鲜香嫩滑，老人孩子都爱吃", time: "12分钟", cal: 200, type: "家常菜", tags: ["鲜香", "嫩滑"], img: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=1200&auto=format&fit=crop",
    ingredients: ["香菇6朵", "鸡蛋3个", "葱花适量", "盐适量"],
    steps: ["香菇切片焯水备用", "鸡蛋打散加少许盐", "香菇先炒香后倒入蛋液", "小火轻推至凝固，撒葱花即可"] },

  { id: 96, name: "青椒炒鸡蛋", desc: "香辣可口，经典下饭菜", time: "12分钟", cal: 190, type: "家常菜", tags: ["下饭", "香辣"], img: "https://images.unsplash.com/photo-1516684732162-798a0062be99?w=1200&auto=format&fit=crop",
    ingredients: ["青椒2个", "鸡蛋3个", "蒜末适量", "盐适量"],
    steps: ["青椒切丝，鸡蛋打散", "鸡蛋炒熟盛出", "蒜末爆香，青椒翻炒至断生", "放鸡蛋回锅，加盐翻匀"] },

  { id: 97, name: "菠菜鸡蛋饼", desc: "高纤早餐，饱腹感强", time: "15分钟", cal: 260, type: "早餐", tags: ["高纤维", "早餐"], img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    ingredients: ["菠菜100g", "鸡蛋2个", "面粉80g", "盐适量", "清水适量"],
    steps: ["菠菜焯水切碎", "鸡蛋、面粉、菠菜和水调成糊", "平底锅刷油倒入面糊", "小火煎至两面金黄"] },

  { id: 98, name: "燕麦鸡蛋饼", desc: "控脂友好，做法简单", time: "12分钟", cal: 230, type: "早餐", tags: ["控脂", "高纤维"], img: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&auto=format&fit=crop",
    ingredients: ["燕麦片80g", "鸡蛋2个", "牛奶120ml", "盐少许"],
    steps: ["燕麦片提前泡软", "与鸡蛋、牛奶混合成糊", "平底锅少油摊平", "小火煎至两面上色即可"] },

  { id: 99, name: "番茄菜花炒蛋", desc: "蔬菜占比高，清爽有层次", time: "18分钟", cal: 220, type: "家常菜", tags: ["蔬菜", "营养"], img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "菜花200g", "鸡蛋2个", "盐适量", "蒜末适量"],
    steps: ["菜花掰小朵焯水，番茄切块", "鸡蛋炒熟盛出", "蒜末爆香后下番茄和菜花", "放回鸡蛋，加盐翻炒均匀"] },

  { id: 100, name: "虾皮紫菜蛋花汤", desc: "鲜味足，补钙思路友好", time: "10分钟", cal: 110, type: "汤类", tags: ["补钙", "清淡"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop",
    ingredients: ["紫菜8g", "鸡蛋2个", "虾皮10g", "葱花适量", "盐适量"],
    steps: ["紫菜和虾皮冲洗备用", "锅中加水煮开后下虾皮", "加入紫菜煮1分钟", "淋入蛋液，加盐调味，撒葱花"] },

  { id: 101, name: "西红柿炖豆腐", desc: "酸甜开胃，清淡下饭", time: "15分钟", cal: 190, type: "素食", tags: ["清淡", "开胃"], img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    ingredients: ["西红柿2个", "豆腐300g", "蒜末适量", "盐适量", "生抽1勺"],
    steps: ["豆腐切块，西红柿切丁", "蒜末爆香后下西红柿炒出汁", "加入豆腐和少量清水", "焖煮5分钟后加盐、生抽"] },

  { id: 102, name: "西葫芦炒鸡蛋", desc: "口感清甜，家常快手", time: "12分钟", cal: 170, type: "家常菜", tags: ["快手", "清爽"], img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    ingredients: ["西葫芦1根", "鸡蛋3个", "蒜末适量", "盐适量"],
    steps: ["西葫芦切片，鸡蛋打散", "鸡蛋炒熟盛出", "蒜末爆香后下西葫芦翻炒", "放回鸡蛋，加盐翻匀即可"] },

  { id: 103, name: "番茄金针菇蛋汤", desc: "酸鲜顺口，低油低负担", time: "12分钟", cal: 140, type: "汤类", tags: ["清淡", "低脂"], img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop",
    ingredients: ["番茄2个", "金针菇150g", "鸡蛋2个", "盐适量", "葱花适量"],
    steps: ["番茄切块，金针菇去根洗净", "锅中加水和番茄煮出味", "放入金针菇煮2分钟", "淋入蛋液，加盐和葱花"] },

  { id: 104, name: "土豆鸡蛋饼", desc: "外酥里软，饱腹感好", time: "18分钟", cal: 280, type: "早餐", tags: ["饱腹", "早餐"], img: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=1200&auto=format&fit=crop",
    ingredients: ["土豆1个", "鸡蛋2个", "面粉60g", "盐适量", "黑胡椒少许"],
    steps: ["土豆擦丝后稍挤水", "与鸡蛋、面粉、盐混合", "平底锅少油摊成饼", "中小火煎至两面金黄"] }
];

// 自动扩展食谱库到 1000 条（保留已有食谱，缺少部分按模板补齐）
const TARGET_RECIPE_COUNT = 1000;
const GENERATED_TYPES = ["汤类", "药膳", "家常菜", "素食", "早餐"];
const GENERATED_IMAGES = [
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1730112696140-19e61bb43d36?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1759216280661-e785edc3922e?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555078604-b2379f0e964a?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=1200&auto=format&fit=crop"
];
const GENERATED_INGREDIENTS = ["鸡胸肉", "番茄", "西兰花", "豆腐", "胡萝卜", "香菇", "土豆", "玉米", "山药", "燕麦", "鸡蛋", "青菜", "南瓜", "海带", "木耳"];
const GENERATED_COOKING = ["清炒", "炖煮", "蒸制", "焖烧", "快手", "暖胃", "低脂", "清补"];

function uniqueTagList(tags) {
  return Array.from(new Set(tags.filter(Boolean))).slice(0, 3);
}

function getGeneratedTypeMeta(type) {
  switch (type) {
    case "汤类":
      return { tags: ["清淡", "暖胃", "补水"], baseCal: 170, baseTime: 25, desc: "清爽顺口，适合日常调理" };
    case "药膳":
      return { tags: ["调理", "滋补", "养生"], baseCal: 240, baseTime: 45, desc: "温和调理，适合阶段性进补" };
    case "家常菜":
      return { tags: ["快手", "下饭", "均衡"], baseCal: 280, baseTime: 18, desc: "家常做法，兼顾口感与营养" };
    case "素食":
      return { tags: ["轻食", "高纤", "低脂"], baseCal: 190, baseTime: 16, desc: "蔬食搭配，轻负担更清爽" };
    case "早餐":
      return { tags: ["高蛋白", "饱腹", "晨间"], baseCal: 260, baseTime: 12, desc: "早餐友好，开启元气一天" };
    default:
      return { tags: ["均衡", "健康"], baseCal: 220, baseTime: 20, desc: "营养均衡，适合日常饮食" };
  }
}

function buildGeneratedRecipe(index, id) {
  const type = GENERATED_TYPES[index % GENERATED_TYPES.length];
  const typeMeta = getGeneratedTypeMeta(type);
  const mainA = GENERATED_INGREDIENTS[index % GENERATED_INGREDIENTS.length];
  const mainB = GENERATED_INGREDIENTS[(index + 3) % GENERATED_INGREDIENTS.length];
  const mainC = GENERATED_INGREDIENTS[(index + 7) % GENERATED_INGREDIENTS.length];
  const style = GENERATED_COOKING[index % GENERATED_COOKING.length];
  const title = `${mainA}${mainB}${style}${type === "汤类" ? "汤" : type === "早餐" ? "早餐碗" : "拼盘"}`;
  const time = `${typeMeta.baseTime + (index % 18)}分钟`;
  const cal = typeMeta.baseCal + ((index * 7) % 110);
  const tags = uniqueTagList([typeMeta.tags[0], typeMeta.tags[1], index % 2 === 0 ? "控脂" : "高纤"]);
  const ingredientAmount = type === "早餐" ? "100g" : "150g";
  const ingredients = [
    `${mainA}${ingredientAmount}`,
    `${mainB}120g`,
    `${mainC}80g`,
    "姜片适量",
    "盐适量"
  ];
  const steps = [
    `准备食材：${mainA}、${mainB}和${mainC}清洗处理备用`,
    `锅中少油或加水加热，先下${mainA}与${mainB}翻炒/煮制`,
    `加入${mainC}后按口味调味，保持中小火至熟透`,
    "出锅前复查咸淡，装盘即可食用"
  ];

  return {
    id,
    name: `${title}（${id}）`,
    desc: typeMeta.desc,
    time,
    cal,
    type,
    tags,
    img: GENERATED_IMAGES[index % GENERATED_IMAGES.length],
    ingredients,
    steps
  };
}

if (recipes.length < TARGET_RECIPE_COUNT) {
  const maxId = recipes.reduce(function(max, item) {
    const numericId = Number(item && item.id);
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0);
  const needCount = TARGET_RECIPE_COUNT - recipes.length;
  for (let i = 0; i < needCount; i += 1) {
    recipes.push(buildGeneratedRecipe(i, maxId + i + 1));
  }
}

// 默认食谱数据（用于没有详细步骤的食谱）
const defaultRecipe = {
  ingredients: ["根据个人口味准备", "适量即可"],
  steps: ["根据个人口味调整", "享受烹饪乐趣"]
};

// 获取食谱详情
function getRecipeDetail(id) {
  const recipe = recipes.find(r => r.id === id);
  return recipe || { name: "未知食谱", ...defaultRecipe };
}
