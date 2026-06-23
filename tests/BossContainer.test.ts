import { BossContainer, BOSS_XP_REWARD } from '../src/domain/boss/BossContainer';
import { Quest } from '../src/domain/quest/Quest';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

const makeBoss = () =>
  new BossContainer([new QuizQuest('q1', 'a'), new QuizQuest('q2', 'b'), new QuizQuest('q3', 'c')]);

describe('BossContainer', () => {
  it('is composition, not inheritance: it is not a Quest', () => {
    expect(makeBoss()).not.toBeInstanceOf(Quest);
  });

  it('grants 50 XP only after every question is answered in sequence', () => {
    const boss = makeBoss();

    expect(boss.answerNext('a')).toMatchObject({ success: true, xp: 0 });
    expect(boss.answerNext('b')).toMatchObject({ success: true, xp: 0 });
    expect(boss.answerNext('c')).toMatchObject({ success: true, xp: BOSS_XP_REWARD });
    expect(boss.isComplete()).toBe(true);
  });

  it('restarts to the first question on a single error without completing any quest', () => {
    const boss = makeBoss();

    const result = boss.answerNext('wrong');

    expect(result.success).toBe(false);
    expect(boss.isComplete()).toBe(false);
    expect(boss.getCurrentQuest()?.question).toBe('q1'); // cursor is back at the start
    boss.getQuests().forEach((quest) => expect(quest.isCompleted()).toBe(false));
  });

  it('restarts after a mistake mid-run, so progress must be redone from the start', () => {
    const boss = makeBoss();

    expect(boss.answerNext('a').success).toBe(true); // advanced to q2
    expect(boss.answerNext('wrong').success).toBe(false); // resets to q1
    expect(boss.getCurrentQuest()?.question).toBe('q1');

    // a full correct run still works afterwards
    expect(boss.answerNext('a').success).toBe(true);
    expect(boss.answerNext('b').success).toBe(true);
    expect(boss.answerNext('c')).toMatchObject({ success: true, xp: BOSS_XP_REWARD });
    expect(boss.isComplete()).toBe(true);
  });

  it('treats an empty boss as already complete', () => {
    const boss = new BossContainer();
    expect(boss.isComplete()).toBe(true);
  });
});
