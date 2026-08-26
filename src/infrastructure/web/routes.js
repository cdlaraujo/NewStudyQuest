import { Router } from 'express';
import { campaignToDto, campaignSummaryToDto, questToDto, playerToDto } from './presenters.js';

/** Conecta os endpoints REST aos casos de uso. Nenhuma lógica de negócio aqui. */
export function createRouter(useCases) {
  const router = Router();

  // POST /api/players/:playerId/campaigns/generate  { text }  — gera uma campanha a partir de texto
  router.post('/players/:playerId/campaigns/generate', (req, res) => {
    const text = (req.body ?? {}).text;
    if (typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Body must include a non-empty "text" string.' });
    }
    const campaign = useCases.generateCampaign.execute(text, req.params.playerId);
    return res.status(201).json(campaignToDto(campaign));
  });

  // GET /api/players/:playerId/campaigns  — antesala: campanhas já geradas pelo jogador
  router.get('/players/:playerId/campaigns', (req, res) => {
    const campaigns = useCases.listCampaigns.execute(req.params.playerId);
    return res.json(campaigns.map(campaignSummaryToDto));
  });

  // DELETE /api/players/:playerId/campaigns/:campaignId  — apaga uma campanha do jogador
  router.delete('/players/:playerId/campaigns/:campaignId', (req, res) => {
    try {
      useCases.deleteCampaign.execute(req.params.campaignId, req.params.playerId);
      return res.status(204).send();
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  });

  // POST /api/players/:playerId/campaigns/:campaignId/quests/:questId/answer  { answer }
  router.post(
    '/players/:playerId/campaigns/:campaignId/quests/:questId/answer',
    (req, res) => {
      const { playerId, campaignId, questId } = req.params;
      const answer = (req.body ?? {}).answer;
      if (typeof answer !== 'string' && !Array.isArray(answer)) {
        return res
          .status(400)
          .json({ error: 'Body must include "answer" as a string or an array of strings.' });
      }
      try {
        const result = useCases.answerQuest.execute(playerId, campaignId, questId, answer);
        return res.json(result);
      } catch (err) {
        return res.status(404).json({ error: err.message });
      }
    },
  );

  // GET /api/players/:playerId/review  — próxima quest da fila de revisão do jogador
  router.get('/players/:playerId/review', (req, res) => {
    const quest = useCases.getNextReview.execute(req.params.playerId);
    if (!quest) {
      return res.status(204).send();
    }
    return res.json(questToDto(quest));
  });

  // GET /api/players/:playerId  — estado atual do jogador
  router.get('/players/:playerId', (req, res) => {
    try {
      return res.json(playerToDto(useCases.getPlayer.execute(req.params.playerId)));
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  });

  // GET /api/campaigns/:campaignId  — estrutura atual da campanha
  router.get('/campaigns/:campaignId', (req, res) => {
    try {
      const campaign = useCases.getCampaign.execute(req.params.campaignId);
      return res.json(campaignToDto(campaign));
    } catch (err) {
      return res.status(404).json({ error: err.message });
    }
  });

  return router;
}
