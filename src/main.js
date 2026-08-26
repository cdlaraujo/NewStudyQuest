import { mkdirSync } from 'fs';
import { join } from 'path';
import { createServer } from './infrastructure/web/server.js';
import { CampaignParser } from './infrastructure/parser/CampaignParser.js';
import { JsonCampaignRepository } from './infrastructure/persistence/JsonCampaignRepository.js';
import { JsonPlayerRepository } from './infrastructure/persistence/JsonPlayerRepository.js';
import { StreakBonus } from './domain/player/StreakBonus.js';
import { ReviewQueue } from './domain/review/ReviewQueue.js';
import { WeightedRandomStrategy } from './domain/review/WeightedRandomStrategy.js';
import { GenerateCampaign } from './application/usecases/GenerateCampaign.js';
import { AnswerQuest } from './application/usecases/AnswerQuest.js';
import { GetNextReview } from './application/usecases/GetNextReview.js';
import { GetPlayer } from './application/usecases/GetPlayer.js';
import { GetCampaign } from './application/usecases/GetCampaign.js';
import { ListCampaigns } from './application/usecases/ListCampaigns.js';
import { DeleteCampaign } from './application/usecases/DeleteCampaign.js';

// ---- Composition root: constrói todas as dependências e as conecta ----

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const DATA_DIR = join(process.cwd(), 'data');
mkdirSync(DATA_DIR, { recursive: true });

const campaignRepo = new JsonCampaignRepository(join(DATA_DIR, 'campaign.json'));
const playerRepo = new JsonPlayerRepository(join(DATA_DIR, 'player.json'));

// Uma fila de revisão por jogador, criada sob demanda — não há persistência
// para ela hoje (é transiente durante a sessão do servidor), só isolamento por id.
const reviewQueues = new Map();
function getReviewQueue(playerId) {
  let queue = reviewQueues.get(playerId);
  if (!queue) {
    queue = new ReviewQueue(new WeightedRandomStrategy());
    reviewQueues.set(playerId, queue);
  }
  return queue;
}

const parser = new CampaignParser();

// O bônus de streak é composto nas concessões de XP (mesma ideia de PricingService(taxas)).
// É stateless (o jogador chega por parâmetro em apply()), então uma única instância
// serve qualquer jogador.
const xpModifiers = [new StreakBonus()];

const useCases = {
  generateCampaign: new GenerateCampaign(parser, campaignRepo),
  answerQuest: new AnswerQuest(campaignRepo, playerRepo, getReviewQueue, xpModifiers),
  getNextReview: new GetNextReview(getReviewQueue),
  getPlayer: new GetPlayer(playerRepo),
  getCampaign: new GetCampaign(campaignRepo),
  listCampaigns: new ListCampaigns(campaignRepo),
  deleteCampaign: new DeleteCampaign(campaignRepo),
};

const app = createServer(useCases);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`EduQuest API listening on http://localhost:${PORT}`);
});
