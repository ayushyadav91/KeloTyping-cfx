import { Router, Request, Response } from 'express';
import { promptsService } from '../models/prompt.model';

export const promptsRouter = Router();

promptsRouter.get('/random', (_req: Request, res: Response) => {
  const prompt = promptsService.getRandomPrompt();
  res.json({ success: true, data: prompt });
});

promptsRouter.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ success: false, error: 'Invalid prompt ID' });
    return;
  }
  const prompt = promptsService.getPromptById(id);
  if (!prompt) {
    res.status(404).json({ success: false, error: 'Prompt not found' });
    return;
  }
  res.json({ success: true, data: prompt });
});
