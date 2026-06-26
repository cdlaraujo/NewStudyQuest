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

const BOSS_RESTART_TEXT = `CAMPANHA: Boss Restart Test
TRILHA: T1
ORDEM: 1
BOSS
Q: First boss question?
R: correct1
Q: Second boss question?
R: correct2`;

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

  it('grants 0 XP when a completed regular quest is answered again', () => {
    expect(useCase.execute(campaign.id!, quizId, '4')).toMatchObject({ correct: true, xpGained: 10 });
    expect(useCase.execute(campaign.id!, quizId, '4')).toMatchObject({ correct: true, xpGained: 0 });
  });

  it('enqueues a boss failure for review', () => {
    const result = useCase.execute(campaign.id!, bossQuestId, 'nope');

    expect(result.correct).toBe(false);
    expect(reviewQueue.size()).toBe(1);
  });

  it('applies the streak bonus modifier when the bonus is active', () => {
    for (let i = 0; i < 7; i++) player.incrementStreak(); // activates the bonus
    expect(player.isStreakBonusActive()).toBe(true);

    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.xpGained).toBe(20); // 10 base, doubled by the active streak bonus
  });
});

describe('AnswerQuest – boss restart', () => {
  const clock = () => new Date('2026-06-15T08:00:00');

  let useCase: AnswerQuest;
  let campaignId: string;
  let bossQ1Id: string;
  let bossQ2Id: string;
  let trail: ReturnType<Campanha['getCurrentUnlockedTrail']>;

  beforeEach(() => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = new CampaignParser().parse(BOSS_RESTART_TEXT);
    campaignRepo.save(campaign);
    campaignId = campaign.id!;

    const player = new Player(DEFAULT_PLAYER_ID, clock);
    const playerRepo = new InMemoryPlayerRepository(player);
    const reviewQueue = new ReviewQueue();

    useCase = new AnswerQuest(campaignRepo, playerRepo, reviewQueue, [], DEFAULT_PLAYER_ID);

    trail = campaign.getCurrentUnlockedTrail();
    const bossQuests = trail!.getBoss().getQuests();
    bossQ1Id = bossQuests[0].id;
    bossQ2Id = bossQuests[1].id;
  });

  it('restarts boss from Q1 after a mid-run wrong answer', () => {
    // Q1 correct — intermediate, cursor → 1
    expect(useCase.execute(campaignId, bossQ1Id, 'correct1')).toMatchObject({
      correct: true,
      xpGained: 0,
    });

    // Q2 wrong — cursor resets to 0
    expect(useCase.execute(campaignId, bossQ2Id, 'WRONG')).toMatchObject({ correct: false });
    expect(trail!.getBoss().getCurrentQuest()?.question).toBe('First boss question?');

    // Q1 correct again — restart worked
    expect(useCase.execute(campaignId, bossQ1Id, 'correct1')).toMatchObject({
      correct: true,
      xpGained: 0,
    });

    // Q2 correct — boss defeated
    const final = useCase.execute(campaignId, bossQ2Id, 'correct2');
    expect(final).toMatchObject({ correct: true, xpGained: 50 });
    expect(trail!.getBoss().isComplete()).toBe(true);
  });
});
