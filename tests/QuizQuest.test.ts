import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('QuizQuest', () => {
  it('normalises casing and whitespace when validating', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate('nucleus')).toBe(true);
    expect(quest.validate('  NUCLEUS  ')).toBe(true);
    expect(quest.validate('Nucleus')).toBe(true);
  });

  it('rejects a wrong answer', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate('mitochondria')).toBe(false);
  });

  it('rejects an array answer (quiz answers are single strings)', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate(['nucleus'])).toBe(false);
  });

  it('marks itself completed only after a correct attempt', () => {
    const quest = new QuizQuest('2 + 2?', '4');

    expect(quest.isCompleted()).toBe(false);

    const wrong = quest.complete('5');
    expect(wrong.success).toBe(false);
    expect(wrong.xp).toBe(0);
    expect(quest.isCompleted()).toBe(false);

    const right = quest.complete('4');
    expect(right.success).toBe(true);
    expect(right.xp).toBe(10);
    expect(quest.isCompleted()).toBe(true);
  });

  it('awards 10 XP', () => {
    expect(new QuizQuest('q', 'a').getXpReward()).toBe(10);
  });
});
