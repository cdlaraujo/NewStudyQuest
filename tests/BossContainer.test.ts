import { BossContainer, BOSS_XP_REWARD } from '../src/domain/boss/BossContainer';
import { Quest } from '../src/domain/quest/Quest';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

const makeBoss = () =>
  new BossContainer([new QuizQuest('q1', 'a'), new QuizQuest('q2', 'b'), new QuizQuest('q3', 'c')]);

describe('BossContainer', () => {
  it('é composição, não herança: não é uma Quest', () => {
    expect(makeBoss()).not.toBeInstanceOf(Quest);
  });

  it('concede 50 XP apenas após todas as perguntas serem respondidas em sequência', () => {
    const boss = makeBoss();

    expect(boss.answerNext('a')).toMatchObject({ success: true, xp: 0 });
    expect(boss.answerNext('b')).toMatchObject({ success: true, xp: 0 });
    expect(boss.answerNext('c')).toMatchObject({ success: true, xp: BOSS_XP_REWARD });
    expect(boss.isComplete()).toBe(true);
  });

  it('reinicia para a primeira pergunta em um único erro sem completar nenhuma quest', () => {
    const boss = makeBoss();

    const result = boss.answerNext('wrong');

    expect(result.success).toBe(false);
    expect(boss.isComplete()).toBe(false);
    expect(boss.getCurrentQuest()?.question).toBe('q1'); // cursor voltou ao início
    boss.getQuests().forEach((quest) => expect(quest.isCompleted()).toBe(false));
  });

  it('reinicia após um erro no meio da run, então o progresso deve ser refeito do início', () => {
    const boss = makeBoss();

    expect(boss.answerNext('a').success).toBe(true); // avançou para q2
    expect(boss.answerNext('wrong').success).toBe(false); // reinicia para q1
    expect(boss.getCurrentQuest()?.question).toBe('q1');

    // uma run completa e correta ainda funciona depois
    expect(boss.answerNext('a').success).toBe(true);
    expect(boss.answerNext('b').success).toBe(true);
    expect(boss.answerNext('c')).toMatchObject({ success: true, xp: BOSS_XP_REWARD });
    expect(boss.isComplete()).toBe(true);
  });

  it('trata um boss vazio como já concluído', () => {
    const boss = new BossContainer();
    expect(boss.isComplete()).toBe(true);
  });
});
