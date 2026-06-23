import { Trilha, TrailState } from '../src/domain/trail/Trilha';
import { BossContainer } from '../src/domain/boss/BossContainer';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('Trilha', () => {
  it('starts LOCKED', () => {
    const trail = new Trilha('T', 1, [new QuizQuest('q', 'a')]);
    expect(trail.getState()).toBe(TrailState.LOCKED);
  });

  it('unlocks from LOCKED, and refuses to unlock from any other state', () => {
    const trail = new Trilha('T', 1, [new QuizQuest('q', 'a')]);

    trail.unlock();
    expect(trail.getState()).toBe(TrailState.UNLOCKED);
    expect(() => trail.unlock()).toThrow();
  });

  it('is complete only when all quests and the boss are done', () => {
    const quiz = new QuizQuest('q', 'a');
    const bossQuiz = new QuizQuest('boss', 'b');
    const trail = new Trilha('T', 1, [quiz], new BossContainer([bossQuiz]));
    trail.unlock();

    expect(trail.isCompleted()).toBe(false);

    quiz.complete('a');
    expect(trail.isCompleted()).toBe(false); // boss not cleared yet

    trail.getBoss().answerNext('b');
    expect(trail.isCompleted()).toBe(true);
    expect(trail.getState()).toBe(TrailState.COMPLETED);
  });

  it('completes with an empty boss once all regular quests are done', () => {
    const quiz = new QuizQuest('q', 'a');
    const trail = new Trilha('T', 1, [quiz]);
    trail.unlock();

    expect(trail.isCompleted()).toBe(false);
    quiz.complete('a');
    expect(trail.isCompleted()).toBe(true);
  });

  it('cannot be completed while still LOCKED', () => {
    const quiz = new QuizQuest('q', 'a');
    const trail = new Trilha('T', 1, [quiz]);
    quiz.complete('a');

    expect(trail.isCompleted()).toBe(false);
    expect(trail.getState()).toBe(TrailState.LOCKED);
  });
});
