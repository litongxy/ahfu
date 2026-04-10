import { Router, Request, Response } from 'express';
import { ACPProtocol, ACPMessage } from '../protocol/acp-parser';
import { SessionManager, SessionData } from '../protocol/session-manager';
import { opencodeAgent } from '../services/opencode-agent.service';
import { isUserScopeAllowed, requireAuthIfEnabled, resolveRequestUserId } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuthIfEnabled);

async function processMessage(
  _acpProtocol: ACPProtocol,
  sessionManager: SessionManager,
  message: ACPMessage,
  session: SessionData
): Promise<{
  response: string;
  scene: string;
  recommendations?: {
    contents: unknown[];
    goods: unknown[];
    pages: Array<{ name: string; url: string }>;
  };
}> {
  const userMessage = message.message.content;

  const history = session.history.map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.content,
  }));

  const result = await opencodeAgent.chat(userMessage, {
    userId: session.userId,
    scene: session.scene,
    history,
  });

  await sessionManager.addMessage(session.id, 'user', userMessage);
  await sessionManager.addMessage(session.id, 'assistant', result.response);

  return {
    response: result.response,
    scene: result.scene,
    recommendations: result.recommendations,
  };
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const acpProtocol = (req as Request & { acpProtocol: ACPProtocol }).acpProtocol;
    const sessionManager = (req as Request & { sessionManager: SessionManager }).sessionManager;

    const message = acpProtocol.parseRequest(req.body);
    if (!message) {
      res.status(400).json(acpProtocol.createErrorResponse('', 'INVALID_REQUEST', 'Invalid ACP message format'));
      return;
    }

    const validation = acpProtocol.validateMessage(message);
    if (!validation.valid) {
      res.status(400).json(acpProtocol.createErrorResponse('', 'VALIDATION_ERROR', validation.error || 'Invalid message'));
      return;
    }

    const requestedUserId = message.context?.userId;
    if (!isUserScopeAllowed(req, requestedUserId)) {
      res.status(403).json(acpProtocol.createErrorResponse('', 'FORBIDDEN', '无权访问其他用户会话'));
      return;
    }

    const resolvedUserId = resolveRequestUserId(req, requestedUserId || undefined) || undefined;
    const session = await sessionManager.getOrCreate(message.sessionId, resolvedUserId);

    const result = await processMessage(acpProtocol, sessionManager, message, session);

    const response = acpProtocol.createResponse(session.id, result.response, {
      scene: result.scene,
      recommendations: result.recommendations,
    });

    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    const acpProtocol = (req as Request & { acpProtocol: ACPProtocol }).acpProtocol;
    res.status(500).json(acpProtocol.createErrorResponse('', 'PROCESS_ERROR', 'Failed to process message'));
  }
});

router.post('/stream', async (req: Request, res: Response) => {
  try {
    const acpProtocol = (req as Request & { acpProtocol: ACPProtocol }).acpProtocol;
    const sessionManager = (req as Request & { sessionManager: SessionManager }).sessionManager;

    const message = acpProtocol.parseRequest(req.body);
    if (!message) {
      res.status(400).json(acpProtocol.createErrorResponse('', 'INVALID_REQUEST', 'Invalid ACP message format'));
      return;
    }

    const requestedUserId = message.context?.userId;
    if (!isUserScopeAllowed(req, requestedUserId)) {
      res.status(403).json(acpProtocol.createErrorResponse('', 'FORBIDDEN', '无权访问其他用户会话'));
      return;
    }

    const resolvedUserId = resolveRequestUserId(req, requestedUserId || undefined) || undefined;
    const session = await sessionManager.getOrCreate(message.sessionId, resolvedUserId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await processMessage(acpProtocol, sessionManager, message, session);

    const words = result.response.split('');
    for (const word of words) {
      res.write(`data: ${JSON.stringify(acpProtocol.createStreamChunk(session.id, word))}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    res.write(`data: ${JSON.stringify(acpProtocol.createStreamDone(session.id))}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).end();
  }
});

export { router as chatRouter };
