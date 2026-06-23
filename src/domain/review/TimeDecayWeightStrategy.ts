import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';
import { WeightedRandomStrategy } from './WeightedRandomStrategy';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A strategy that first ages the queue — increasing each entry's weight in
 * proportion to the whole days elapsed since its last attempt — and then
 * delegates the actual pick to another strategy (a weighted lottery by
 * default). This makes long-neglected questions resurface.
 */
export class TimeDecayWeightStrategy implements WeightStrategy {
  constructor(
    private readonly decayPerDay: number = 1,
    private readonly now: () => Date = () => new Date(),
    private readonly selector: WeightStrategy = new WeightedRandomStrategy(),
  ) {}

  /**
   * Increases each entry's weight by `daysSinceLastAttempt * decayPerDay` and
   * refreshes its `lastAttempt`. Exposed separately so the ageing behaviour can
   * be asserted directly.
   */
  applyDecay(entries: ReviewEntry[]): void {
    const current = this.now();
    for (const entry of entries) {
      const days = Math.floor((current.getTime() - entry.lastAttempt.getTime()) / MS_PER_DAY);
      if (days > 0) {
        entry.weight += days * this.decayPerDay;
        entry.lastAttempt = current;
      }
    }
  }

  select(entries: ReviewEntry[]): Quest | null {
    this.applyDecay(entries);
    return this.selector.select(entries);
  }
}
