import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('QuizQuest', () => {
  it('normaliza maiúsculas/minúsculas e espaços ao validar', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate('nucleus')).toBe(true);
    expect(quest.validate('  NUCLEUS  ')).toBe(true);
    expect(quest.validate('Nucleus')).toBe(true);
  });

  it('rejeita uma resposta errada', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate('mitochondria')).toBe(false);
  });

  it('rejeita resposta em array (respostas de quiz são strings simples)', () => {
    const quest = new QuizQuest('Where is DNA stored?', 'Nucleus');

    expect(quest.validate(['nucleus'])).toBe(false);
  });

  it('marca-se como concluída apenas após uma tentativa correta', () => {
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

  it('concede 10 XP', () => {
    expect(new QuizQuest('q', 'a').getXpReward()).toBe(10);
  });
});
