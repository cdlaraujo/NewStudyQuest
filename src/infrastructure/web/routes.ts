import { Router, Request, Response } from 'express';
import { GenerateCampaign } from '../../application/usecases/GenerateCampaign';
import { AnswerQuest } from '../../application/usecases/AnswerQuest';
import { GetNextReview } from '../../application/usecases/GetNextReview';
import { GetPlayer } from '../../application/usecases/GetPlayer';
import { GetCampaign } from '../../application/usecases/GetCampaign';
import { campaignToDto, questToDto, playerToDto } from './presenters';

export interface UseCases {
  generateCampaign: GenerateCampaign;
  answerQuest: AnswerQuest;
  getNextReview: GetNextReview;
  getPlayer: GetPlayer;
  getCampaign: GetCampaign;
}

/** Conecta os endpoints REST aos casos de uso. Nenhuma lógica de negócio aqui. */
export function createRouter(useCases: UseCases): Router {
  const router = Router();

  // POST /api/campaigns/generate  { text }  — gera uma campanha a partir de texto
  router.post('/campaigns/generate', (req: Request, res: Response) => {
    const text = (req.body ?? {}).text;
    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Body must include a non-empty "text" string.' });
    }
    const campaign = useCases.generateCampaign.execute(text);
    return res.status(201).json(campaignToDto(campaign));
  });

  // POST /api/campaigns/:campaignId/quests/:questId/answer  { answer }  — responde uma quest
  router.post('/campaigns/:campaignId/quests/:questId/answer', (req: Request, res: Response) => {
    const { campaignId, questId } = req.params;
    const answer = (req.body ?? {}).answer;
    if (typeof answer !== 'string' && !Array.isArray(answer)) {
      return res
        .status(400)
        .json({ error: 'Body must include "answer" as a string or an array of strings.' });
    }
    try {
      const result = useCases.answerQuest.execute(campaignId, questId, answer);
      return res.json(result);
    } catch (err) {
      return res.status(404).json({ error: (err as Error).message });
    }
  });

  // GET /api/player/review  — próxima quest da fila de revisão
  router.get('/player/review', (_req: Request, res: Response) => {
    const quest = useCases.getNextReview.execute();
    if (!quest) {
      return res.status(204).send();
    }
    return res.json(questToDto(quest));
  });

  // GET /api/player  — estado atual do jogador
  router.get('/player', (_req: Request, res: Response) => {
    return res.json(playerToDto(useCases.getPlayer.execute()));
  });

  // GET /api/campaigns/:campaignId  — estrutura atual da campanha
  router.get('/campaigns/:campaignId', (req: Request, res: Response) => {
    try {
      const campaign = useCases.getCampaign.execute(req.params.campaignId);
      return res.json(campaignToDto(campaign));
    } catch (err) {
      return res.status(404).json({ error: (err as Error).message });
    }
  });

  return router;
}
