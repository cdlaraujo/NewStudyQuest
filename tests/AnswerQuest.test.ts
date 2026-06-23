import { AnswerQuest } from '../src/application/usecases/AnswerQuest';
import { CampaignParser } from '../src/infrastructure/parser/CampaignParser';
import { InMemoryCampaignRepository } from '../src/infrastructure/persistence/InMemoryCampaignRepository';
import {
  InMemoryPlayerRepository,
  DEFAULT_PLAYER_ID,
} from '../src/infrastructure/persistence/InMemoryPlayerRepository';
import { Player } from '../src/domain/player/Player';
import { StreakBonus } from '../src/domain/player/StreakBonus';
import { ReviewQueue } from '../src/domain/review/ReviewQueue';
import { Campanha } from '../src/domain/campaign/Campanha';

const TEXT = `CAMPANHA: Test
TRILHA: T1
ORDEM: 1
Q: 2 + 2?
R: 4
BOSS
Q: Boss question?
R: win`;

describe('AnswerQuest', () => {
  const clock = () => new Date('2026-06-15T08:00:00');

  let campaign: Campanha;
  let campaignRepo: InMemoryCampaignRepository;
  let playerRepo: InMemoryPlayerRepository;
  let reviewQueue: ReviewQueue;
  let player: Player;
  let useCase: AnswerQuest;
  let quizId: string;
  let bossQuestId: string;

  beforeEach(() => {
    campaignRepo = new InMemoryCampaignRepository();
    campaign = new CampaignParser().parse(TEXT);
    campaignRepo.save(campaign);

    player = new Player(DEFAULT_PLAYER_ID, clock);
    playerRepo = new InMemoryPlayerRepository(player);
    reviewQueue = new ReviewQueue();

    const modifiers = [new StreakBonus(player)];
    useCase = new AnswerQuest(campaignRepo, playerRepo, reviewQueue, modifiers, DEFAULT_PLAYER_ID);

    const trail = campaign.getCurrentUnlockedTrail()!;
    quizId = trail.getQuests()[0].id;
    bossQuestId = trail.getBoss().getQuests()[0].id;
  });

  it('awards XP and bumps the streak on a correct quiz', () => {
    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.correct).toBe(true);
    expect(result.xpGained).toBe(10);
    expect(result.streak).toBe(1);
    expect(player.getXp()).toBe(10);
  });

  it('levels up when the awarded XP crosses the threshold', () => {
    player.addXp(95); // 5 short of level 2

    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(player.getLevel()).toBe(2);
  });

  it('enqueues a missed (non-boss) quest for review with the error weight', () => {
    const result = useCase.execute(campaign.id!, quizId, 'wrong');

    expect(result.correct).toBe(false);
    expect(reviewQueue.size()).toBe(1);
    expect(reviewQueue.getEntries()[0].weight).toBe(5);
  });

  it('never enqueues a boss failure', () => {
    const result = useCase.execute(campaign.id!, bossQuestId, 'nope');

    expect(result.correct).toBe(false);
    expect(reviewQueue.isEmpty()).toBe(true);
  });

  it('applies the streak bonus modifier when the bonus is active', () => {
    for (let i = 0; i < 7; i++) player.incrementStreak(); // activates the bonus
    expect(player.isStreakBonusActive()).toBe(true);

    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.xpGained).toBe(20); // 10 base, doubled by the active streak bonus
  });
});
