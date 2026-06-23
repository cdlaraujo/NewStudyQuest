import { QuestResult } from './QuestResult';

/** A quiz answer is a single string; a fill-in-the-blank answer is an array. */
export type Answer = string | string[];

/** Display-friendly projection of a quest (no answers leaked). */
export interface QuestView {
  id: string;
  type: string;
  prompt: string;
  gaps?: number;
}

/**
 * Abstract base every concrete question type extends. It owns the identity,
 * the prompt and the (externally immutable) completion flag, and defines the
 * polymorphic contract: each subclass decides how to validate an answer and
 * how much XP it awards. No code outside a subclass ever asks "what kind of
 * quest is this?" — the object answers for itself.
 */
export abstract class Quest {
  #completed = false;

  constructor(
    public readonly id: string,
    public readonly question: string,
  ) {}

  /** Returns true when `answer` satisfies this quest. */
  abstract validate(answer: Answer): boolean;

  /** XP granted when this quest is answered correctly. */
  abstract getXpReward(): number;

  /** Display projection used by the presentation layer. */
  abstract toView(): QuestView;

  /**
   * Attempts the quest. On success the quest is marked completed and a
   * positive-XP result is returned; on failure nothing changes.
   */
  complete(answer: Answer): QuestResult {
    if (this.validate(answer)) {
      this.#completed = true;
      return new QuestResult(true, this.getXpReward());
    }
    return new QuestResult(false, 0);
  }

  /** Read-only view of the completion flag; it can never be set from outside. */
  isCompleted(): boolean {
    return this.#completed;
  }
}
