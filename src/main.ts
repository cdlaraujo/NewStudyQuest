import { createServer } from './infrastructure/web/server';
import { CampaignParser } from './infrastructure/parser/CampaignParser';
import { InMemoryCampaignRepository } from './infrastructure/persistence/InMemoryCampaignRepository';
import {
  InMemoryPlayerRepository,
  DEFAULT_PLAYER_ID,
} from './infrastructure/persistence/InMemoryPlayerRepository';
import { Player } from './domain/player/Player';
import { StreakBonus } from './domain/player/StreakBonus';
import { ReviewQueue } from './domain/review/ReviewQueue';
import { WeightedRandomStrategy } from './domain/review/WeightedRandomStrategy';
import { GenerateCampaign } from './application/usecases/GenerateCampaign';
import { AnswerQuest } from './application/usecases/AnswerQuest';
import { GetNextReview } from './application/usecases/GetNextReview';
import { GetPlayer } from './application/usecases/GetPlayer';
import { GetCampaign } from './application/usecases/GetCampaign';

// ---- Composition root: build every dependency and wire them together ----

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const player = new Player(DEFAULT_PLAYER_ID);

const campaignRepo = new InMemoryCampaignRepository();
const playerRepo = new InMemoryPlayerRepository(player);
const reviewQueue = new ReviewQueue(new WeightedRandomStrategy());
const parser = new CampaignParser();

// The streak bonus is composed into XP awards (same idea as PricingService(fees)).
const xpModifiers = [new StreakBonus(player)];

const useCases = {
  generateCampaign: new GenerateCampaign(parser, campaignRepo),
  answerQuest: new AnswerQuest(campaignRepo, playerRepo, reviewQueue, xpModifiers, DEFAULT_PLAYER_ID),
  getNextReview: new GetNextReview(reviewQueue),
  getPlayer: new GetPlayer(playerRepo, DEFAULT_PLAYER_ID),
  getCampaign: new GetCampaign(campaignRepo),
};

const app = createServer(useCases);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`EduQuest API listening on http://localhost:${PORT}`);
});
