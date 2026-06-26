/**
 * Tiny immutable value object returned whenever a quest is attempted.
 * It only carries whether the attempt succeeded and how much XP it is worth.
 */
export class QuestResult {
  constructor(
    public readonly success: boolean,
    public readonly xp: number,
    public readonly correctAnswer?: string | string[],
  ) {}

  static correct(xp: number): QuestResult {
    return new QuestResult(true, xp);
  }

  static wrong(correctAnswer?: string | string[]): QuestResult {
    return new QuestResult(false, 0, correctAnswer);
  }
}
