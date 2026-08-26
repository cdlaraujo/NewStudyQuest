import { randomUUID } from 'crypto';
import { Quest } from './Quest.js';

export class MultipleChoiceQuest extends Quest {
  #options;
  #correctIndex;

  constructor(question, options, correctIndex, id = randomUUID()) {
    super(id, question);
    this.#options = options;
    this.#correctIndex = correctIndex;
  }

  validate(answer) {
    return typeof answer === 'string' && parseInt(answer, 10) === this.#correctIndex;
  }

  getXpReward() {
    return 10;
  }

  getCorrectAnswer() {
    return this.#options[this.#correctIndex];
  }

  toView() {
    return {
      id: this.id,
      type: 'multiple-choice',
      prompt: this.question,
      options: this.#options,
    };
  }

  toJSON() {
    return { type: 'multiple-choice', id: this.id, question: this.question, completed: this.isCompleted(), options: this.#options, correctIndex: this.#correctIndex };
  }

  static fromJSON(data) {
    const q = new MultipleChoiceQuest(data.question, data.options, data.correctIndex, data.id);
    if (data.completed) q._restoreCompleted();
    return q;
  }
}
