import { ReviewQueue } from '../../domain/review/ReviewQueue';
import { Quest } from '../../domain/quest/Quest';

/**
 * Returns the next quest to review, chosen by the review queue's weight
 * strategy. Useful when the player wants to revise instead of advancing.
 */
export class GetNextReview {
  constructor(private readonly reviewQueue: ReviewQueue) {}

  execute(): Quest | null {
    return this.reviewQueue.getNext();
  }
}
