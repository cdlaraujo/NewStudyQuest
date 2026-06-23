import { Quest } from '../quest/Quest';

/** One entry tracked by the review queue. */
export interface ReviewEntry {
  quest: Quest;
  weight: number;
  lastAttempt: Date;
}

/**
 * Strategy that decides which quest the review queue surfaces next. The queue
 * delegates entirely to an implementation of this interface, so it never needs
 * to know how weights translate into a choice.
 */
export interface WeightStrategy {
  select(entries: ReviewEntry[]): Quest | null;
}
