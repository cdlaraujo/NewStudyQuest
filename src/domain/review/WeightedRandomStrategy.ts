import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';

/**
 * Default review strategy: a weighted lottery. A quest's chance of being
 * picked is proportional to its weight, so the questions a player keeps getting
 * wrong come back more often. The RNG is injectable for deterministic tests.
 */
export class WeightedRandomStrategy implements WeightStrategy {
  constructor(private readonly rng: () => number = Math.random) {}

  select(entries: ReviewEntry[]): Quest | null {
    if (entries.length === 0) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) {
      // every weight is zero — fall back to a uniform pick
      const index = Math.min(entries.length - 1, Math.floor(this.rng() * entries.length));
      return entries[index].quest;
    }

    let roll = this.rng() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) {
        return entry.quest;
      }
    }
    return entries[entries.length - 1].quest;
  }
}
