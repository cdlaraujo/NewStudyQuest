import { CampaignParser } from '../src/infrastructure/parser/CampaignParser';
import { QuizQuest } from '../src/domain/quest/QuizQuest';
import { FillInTheBlankQuest } from '../src/domain/quest/FillInTheBlankQuest';
import { TrailState } from '../src/domain/trail/Trilha';

const SAMPLE = `CAMPANHA: Biology 101

TRILHA: Cell Structure
ORDEM: 1
Q: What organelle stores DNA?
R: Nucleus

L: The {mitochondria} is the powerhouse of the {cell}.

TRILHA: Genetics
ORDEM: 2
Q: What molecule carries genetic information?
R: DNA
BOSS
Q: Final boss question?
R: 42
L: DNA has {two} strands.
`;

describe('CampaignParser', () => {
  const campaign = new CampaignParser().parse(SAMPLE);
  const [trail1, trail2] = campaign.getTrails();

  it('reads the campaign name and both trails', () => {
    expect(campaign.name).toBe('Biology 101');
    expect(campaign.getTrails()).toHaveLength(2);
    expect(trail1.name).toBe('Cell Structure');
    expect(trail1.order).toBe(1);
    expect(trail2.name).toBe('Genetics');
    expect(trail2.order).toBe(2);
  });

  it('builds quiz and fill-in-the-blank quests (blank lines ignored)', () => {
    const quests = trail1.getQuests();
    expect(quests).toHaveLength(2);

    expect(quests[0]).toBeInstanceOf(QuizQuest);
    expect(quests[0].question).toBe('What organelle stores DNA?');
    expect(quests[0].validate('nucleus')).toBe(true);

    expect(quests[1]).toBeInstanceOf(FillInTheBlankQuest);
    expect((quests[1] as FillInTheBlankQuest).gapCount).toBe(2);
    expect(quests[1].validate(['mitochondria', 'cell'])).toBe(true);
  });

  it('routes post-BOSS questions into the trail boss container', () => {
    expect(trail1.getBoss().size).toBe(0); // first trail has no BOSS section

    const boss = trail2.getBoss();
    expect(trail2.getQuests()).toHaveLength(1); // the DNA quiz appears before BOSS
    expect(boss.size).toBe(2);
    expect(boss.getQuests()[0]).toBeInstanceOf(QuizQuest);
    expect(boss.getQuests()[0].validate('42')).toBe(true);
    expect(boss.getQuests()[1]).toBeInstanceOf(FillInTheBlankQuest);
    expect(boss.getQuests()[1].validate(['two'])).toBe(true);
  });

  it('auto-unlocks the first trail only', () => {
    expect(trail1.getState()).toBe(TrailState.UNLOCKED);
    expect(trail2.getState()).toBe(TrailState.LOCKED);
  });
});
