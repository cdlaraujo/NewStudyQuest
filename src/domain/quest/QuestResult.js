/**
 * Pequeno value object imutável retornado sempre que uma quest é tentada.
 * Carrega apenas se a tentativa foi bem-sucedida e quanto XP ela vale.
 */
export class QuestResult {
  constructor(success, xp, correctAnswer) {
    this.success = success;
    this.xp = xp;
    this.correctAnswer = correctAnswer;
  }

  static correct(xp) {
    return new QuestResult(true, xp);
  }

  static wrong(correctAnswer) {
    return new QuestResult(false, 0, correctAnswer);
  }
}
