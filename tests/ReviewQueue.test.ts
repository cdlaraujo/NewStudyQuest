import { ReviewQueue } from '../src/domain/review/ReviewQueue';
import { WeightedRandomStrategy } from '../src/domain/review/WeightedRandomStrategy';
import { TimeDecayWeightStrategy } from '../src/domain/review/TimeDecayWeightStrategy';
import { ReviewEntry, WeightStrategy } from '../src/domain/review/WeightStrategy';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('ReviewQueue', () => {
  it('enqueues a quest with its initial weight', () => {
    const queue = new ReviewQueue();
    queue.enqueue(new QuizQuest('q', 'a'), 5);

    expect(queue.size()).toBe(1);
    expect(queue.getEntries()[0].weight).toBe(5);
  });

  it('stacks weight when the same quest is enqueued again', () => {
    const queue = new ReviewQueue();
    const quest = new QuizQuest('q', 'a');

    queue.enqueue(quest, 5);
    queue.enqueue(quest, 5);

    expect(queue.size()).toBe(1);
    expect(queue.getEntries()[0].weight).toBe(10);
  });

  it('delegates getNext to the injected strategy', () => {
    const quest = new QuizQuest('q', 'a');
    const strategy: WeightStrategy = { select: jest.fn().mockReturnValue(quest) };
    const queue = new ReviewQueue(strategy);
    queue.enqueue(quest, 5);

    expect(queue.getNext()).toBe(quest);
    expect(strategy.select).toHaveBeenCalledWith(queue.getEntries());
  });
});

describe('WeightedRandomStrategy', () => {
  it('picks proportionally to weight using the injected RNG', () => {
    const qA = new QuizQuest('a', 'a');
    const qB = new QuizQuest('b', 'b');
    const entries: ReviewEntry[] = [
      { quest: qA, weight: 1, lastAttempt: new Date() },
      { quest: qB, weight: 3, lastAttempt: new Date() },
    ];

    // total weight = 4; roll = rng() * 4
    expect(new WeightedRandomStrategy(() => 0).select(entries)).toBe(qA); // roll 0 -> first
    expect(new WeightedRandomStrategy(() => 0.5).select(entries)).toBe(qB); // roll 2 -> second
  });

  it('returns null for an empty queue', () => {
    expect(new WeightedRandomStrategy().select([])).toBeNull();
  });
});

describe('TimeDecayWeightStrategy', () => {
  it('increases each weight in proportion to the days since last attempt', () => {
    const now = new Date('2026-06-15T00:00:00');
    const threeDaysAgo = new Date('2026-06-12T00:00:00');
    const entries: ReviewEntry[] = [
      { quest: new QuizQuest('q', 'a'), weight: 5, lastAttempt: threeDaysAgo },
    ];

    new TimeDecayWeightStrategy(1, () => now).applyDecay(entries);

    expect(entries[0].weight).toBe(8); // 5 + (3 days * 1)
    expect(entries[0].lastAttempt).toEqual(now);
  });
});
