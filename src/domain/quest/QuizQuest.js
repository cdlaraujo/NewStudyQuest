import { createId } from '../shared/createId.js';
import { Quest } from './Quest.js';
import { normalize } from '../shared/normalize.js';

/**
 * Questão de resposta única. A resposta esperada é armazenada de forma privada
 * e comparada após normalização, de modo que maiúsculas/minúsculas e espaços
 * ao redor nunca importam.
 */
export class QuizQuest extends Quest {
  #answer;

  constructor(question, answer, id = createId()) {
    super(id, question);
    this.#answer = answer;
  }

  validate(answer) {
    if (typeof answer !== 'string') {
      return false;
    }
    return normalize(answer) === normalize(this.#answer);
  }

  getXpReward() {
    return 10;
  }

  getCorrectAnswer() {
    return this.#answer;
  }

  toView() {
    return { id: this.id, type: 'quiz', prompt: this.question, completed: this.isCompleted() };
  }

  toJSON() {
    return { type: 'quiz', id: this.id, question: this.question, completed: this.isCompleted(), answer: this.#answer };
  }

  static fromJSON(data) {
    const q = new QuizQuest(data.question, data.answer, data.id);
    if (data.completed) q._restoreCompleted();
    return q;
  }
}
