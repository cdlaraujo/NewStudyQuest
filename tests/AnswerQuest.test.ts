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
import { TrailState } from '../src/domain/trail/Trilha';

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

  it('concede XP e incrementa o streak em um quiz correto', () => {
    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.correct).toBe(true);
    expect(result.xpGained).toBe(10);
    expect(result.streak).toBe(1);
    expect(player.getXp()).toBe(10);
  });

  it('sobe de nível quando o XP concedido cruza o limiar', () => {
    player.addXp(95); // 5 a menos para o nível 2

    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
    expect(player.getLevel()).toBe(2);
  });

  it('enfileira uma quest errada (não-boss) para revisão com o peso de erro', () => {
    const result = useCase.execute(campaign.id!, quizId, 'wrong');

    expect(result.correct).toBe(false);
    expect(reviewQueue.size()).toBe(1);
    expect(reviewQueue.getEntries()[0].weight).toBe(5);
  });

  it('concede 0 XP quando uma quest normal já concluída é respondida novamente', () => {
    expect(useCase.execute(campaign.id!, quizId, '4')).toMatchObject({ correct: true, xpGained: 10 });
    expect(useCase.execute(campaign.id!, quizId, '4')).toMatchObject({ correct: true, xpGained: 0 });
  });

  it('enfileira um erro no boss para revisão', () => {
    const result = useCase.execute(campaign.id!, bossQuestId, 'nope');

    expect(result.correct).toBe(false);
    expect(reviewQueue.size()).toBe(1);
  });

  it('aplica o modificador de bônus de streak quando o bônus está ativo', () => {
    for (let i = 0; i < 7; i++) player.incrementStreak(); // ativa o bônus
    expect(player.isStreakBonusActive()).toBe(true);

    const result = useCase.execute(campaign.id!, quizId, '4');

    expect(result.xpGained).toBe(20); // 10 de base, dobrado pelo bônus de streak ativo
  });
});

describe('AnswerQuest – reinício do boss', () => {
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

  it('reinicia o boss da Q1 após uma resposta errada no meio da run', () => {
    // Q1 correto — intermediário, cursor → 1
    expect(useCase.execute(campaignId, bossQ1Id, 'correct1')).toMatchObject({
      correct: true,
      xpGained: 0,
    });

    // Q2 errado — cursor reinicia para 0
    expect(useCase.execute(campaignId, bossQ2Id, 'WRONG')).toMatchObject({ correct: false });
    expect(trail!.getBoss().getCurrentQuest()?.question).toBe('First boss question?');

    // Q1 correto novamente — reinício funcionou
    expect(useCase.execute(campaignId, bossQ1Id, 'correct1')).toMatchObject({
      correct: true,
      xpGained: 0,
    });

    // Q2 correto — boss derrotado
    const final = useCase.execute(campaignId, bossQ2Id, 'correct2');
    expect(final).toMatchObject({ correct: true, xpGained: 50 });
    expect(trail!.getBoss().isComplete()).toBe(true);
  });
});

const TWO_TRAIL_TEXT = `CAMPANHA: Two Trails
TRILHA: T1
ORDEM: 1
Q: Q1?
R: a
BOSS
Q: BQ1?
R: b
TRILHA: T2
ORDEM: 2
Q: Q2?
R: c`;

describe('AnswerQuest – desbloqueio de trilha', () => {
  const clock = () => new Date('2026-06-15T08:00:00');

  it('desbloqueia a próxima trilha após concluir todas as quests e o boss', () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = new CampaignParser().parse(TWO_TRAIL_TEXT);
    campaignRepo.save(campaign);

    const playerRepo = new InMemoryPlayerRepository(new Player(DEFAULT_PLAYER_ID, clock));
    const useCase = new AnswerQuest(campaignRepo, playerRepo, new ReviewQueue(), []);

    const trail1 = campaign.getTrails()[0];
    const q1Id = trail1.getQuests()[0].id;
    const bq1Id = trail1.getBoss().getQuests()[0].id;

    useCase.execute(campaign.id!, q1Id, 'a');  // quest normal
    useCase.execute(campaign.id!, bq1Id, 'b'); // boss — trilha 1 conclui, trilha 2 desbloqueia

    const trail2 = campaign.getTrails()[1];
    expect(trail2.getState()).toBe(TrailState.UNLOCKED);
  });

  it('não desbloqueia a próxima trilha enquanto o boss não foi derrotado', () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = new CampaignParser().parse(TWO_TRAIL_TEXT);
    campaignRepo.save(campaign);

    const playerRepo = new InMemoryPlayerRepository(new Player(DEFAULT_PLAYER_ID, clock));
    const useCase = new AnswerQuest(campaignRepo, playerRepo, new ReviewQueue(), []);

    const trail1 = campaign.getTrails()[0];
    const q1Id = trail1.getQuests()[0].id;
    useCase.execute(campaign.id!, q1Id, 'a'); // apenas quest normal concluída

    const trail2 = campaign.getTrails()[1];
    expect(trail2.getState()).toBe(TrailState.LOCKED);
  });
});
