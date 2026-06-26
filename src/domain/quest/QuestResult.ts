/**
 * Pequeno value object imutável retornado sempre que uma quest é tentada.
 * Carrega apenas se a tentativa foi bem-sucedida e quanto XP ela vale.
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
