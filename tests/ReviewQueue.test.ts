import { ReviewQueue } from '../src/domain/review/ReviewQueue';
import { WeightedRandomStrategy } from '../src/domain/review/WeightedRandomStrategy';
import { TimeDecayWeightStrategy } from '../src/domain/review/TimeDecayWeightStrategy';
import { ReviewEntry, WeightStrategy } from '../src/domain/review/WeightStrategy';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('ReviewQueue', () => {
  it('enfileira uma quest com seu peso inicial', () => {
    const queue = new ReviewQueue();
    queue.enqueue(new QuizQuest('q', 'a'), 5);

    expect(queue.size()).toBe(1);
    expect(queue.getEntries()[0].weight).toBe(5);
  });

  it('acumula peso quando a mesma quest é enfileirada novamente', () => {
    const queue = new ReviewQueue();
    const quest = new QuizQuest('q', 'a');

    queue.enqueue(quest, 5);
    queue.enqueue(quest, 5);

    expect(queue.size()).toBe(1);
    expect(queue.getEntries()[0].weight).toBe(10);
  });

  it('delega getNext à strategy injetada', () => {
    const quest = new QuizQuest('q', 'a');
    const strategy: WeightStrategy = { select: jest.fn().mockReturnValue(quest) };
    const queue = new ReviewQueue(strategy);
    queue.enqueue(quest, 5);

    expect(queue.getNext()).toBe(quest);
    expect(strategy.select).toHaveBeenCalledWith(queue.getEntries());
  });
});

describe('WeightedRandomStrategy', () => {
  it('escolhe proporcionalmente ao peso usando o RNG injetado', () => {
    const qA = new QuizQuest('a', 'a');
    const qB = new QuizQuest('b', 'b');
    const entries: ReviewEntry[] = [
      { quest: qA, weight: 1, lastAttempt: new Date() },
      { quest: qB, weight: 3, lastAttempt: new Date() },
    ];

    // peso total = 4; sorteio = rng() * 4
    expect(new WeightedRandomStrategy(() => 0).select(entries)).toBe(qA); // sorteio 0 -> primeiro
    expect(new WeightedRandomStrategy(() => 0.5).select(entries)).toBe(qB); // sorteio 2 -> segundo
  });

  it('retorna null para uma fila vazia', () => {
    expect(new WeightedRandomStrategy().select([])).toBeNull();
  });
});

describe('TimeDecayWeightStrategy', () => {
  it('aumenta cada peso em proporção aos dias desde a última tentativa', () => {
    const now = new Date('2026-06-15T00:00:00');
    const threeDaysAgo = new Date('2026-06-12T00:00:00');
    const entries: ReviewEntry[] = [
      { quest: new QuizQuest('q', 'a'), weight: 5, lastAttempt: threeDaysAgo },
    ];

    new TimeDecayWeightStrategy(1, () => now).applyDecay(entries);

    expect(entries[0].weight).toBe(8); // 5 + (3 dias * 1)
    expect(entries[0].lastAttempt).toEqual(now);
  });
});
