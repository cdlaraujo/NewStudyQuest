import { Trilha, TrailState } from '../src/domain/trail/Trilha';
import { BossContainer } from '../src/domain/boss/BossContainer';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('Trilha', () => {
  it('começa LOCKED', () => {
    const trail = new Trilha('T', 1, [new QuizQuest('q', 'a')]);
    expect(trail.getState()).toBe(TrailState.LOCKED);
  });

  it('desbloqueia a partir de LOCKED, e recusa desbloquear a partir de qualquer outro estado', () => {
    const trail = new Trilha('T', 1, [new QuizQuest('q', 'a')]);

    trail.unlock();
    expect(trail.getState()).toBe(TrailState.UNLOCKED);
    expect(() => trail.unlock()).toThrow();
  });

  it('está completa apenas quando todas as quests e o boss estão concluídos', () => {
    const quiz = new QuizQuest('q', 'a');
    const bossQuiz = new QuizQuest('boss', 'b');
    const trail = new Trilha('T', 1, [quiz], new BossContainer([bossQuiz]));
    trail.unlock();

    expect(trail.isCompleted()).toBe(false);

    quiz.complete('a');
    expect(trail.isCompleted()).toBe(false); // boss ainda não derrotado

    trail.getBoss().answerNext('b');
    expect(trail.isCompleted()).toBe(true);
    expect(trail.getState()).toBe(TrailState.COMPLETED);
  });

  it('completa com boss vazio assim que todas as quests normais estão concluídas', () => {
    const quiz = new QuizQuest('q', 'a');
    const trail = new Trilha('T', 1, [quiz]);
    trail.unlock();

    expect(trail.isCompleted()).toBe(false);
    quiz.complete('a');
    expect(trail.isCompleted()).toBe(true);
  });

  it('não pode ser concluída enquanto ainda está LOCKED', () => {
    const quiz = new QuizQuest('q', 'a');
    const trail = new Trilha('T', 1, [quiz]);
    quiz.complete('a');

    expect(trail.isCompleted()).toBe(false);
    expect(trail.getState()).toBe(TrailState.LOCKED);
  });
});
