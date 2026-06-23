import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';
import { WeightedRandomStrategy } from './WeightedRandomStrategy';

/**
 * Holds the quests a player should revisit. Each quest has a weight; enqueuing
 * the same quest again *stacks* (adds to) its weight, so repeated mistakes make
 * it more likely to resurface. The queue does not compute weights — choosing
 * the next quest is delegated to an injected {@link WeightStrategy}.
 */
export class ReviewQueue {
  readonly #entries: ReviewEntry[] = [];

  constructor(
    private readonly strategy: WeightStrategy = new WeightedRandomStrategy(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  enqueue(quest: Quest, initialWeight: number): void {
    const existing = this.#entries.find((entry) => entry.quest.id === quest.id);
    if (existing) {
      existing.weight += initialWeight; // stacking effect for repeated errors
      existing.lastAttempt = this.now();
    } else {
      this.#entries.push({ quest, weight: initialWeight, lastAttempt: this.now() });
    }
  }

  getNext(): Quest | null {
    return this.strategy.select(this.#entries);
  }

  size(): number {
    return this.#entries.length;
  }

  isEmpty(): boolean {
    return this.#entries.length === 0;
  }

  /** Read-only snapshot of the entries (used by tests and presenters). */
  getEntries(): ReadonlyArray<ReviewEntry> {
    return this.#entries;
  }
}
