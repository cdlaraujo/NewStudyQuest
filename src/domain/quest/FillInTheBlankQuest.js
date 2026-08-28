import { Quest } from './Quest.js';
import { normalize } from '../shared/normalize.js';
import { createId } from '../shared/createId.js';

/**
 * Questão com uma ou mais lacunas. O texto exibido e as respostas ficam separados,
 * evitando que `{}` de LaTeX seja confundido com marcação do EduQuest.
 */
export class FillInTheBlankQuest extends Quest {
  #expectedWords;

  constructor(prompt, answers, id = createId()) {
    super(id, prompt);
    this.#expectedWords = [...answers];
  }

  get gapCount() {
    return this.#expectedWords.length;
  }

  validate(answer) {
    if (!Array.isArray(answer) || answer.length !== this.#expectedWords.length) {
      return false;
    }
    return this.#expectedWords.every(
      (word, index) => normalize(word) === normalize(answer[index] ?? ''),
    );
  }

  getXpReward() {
    return 15;
  }

  getCorrectAnswer() {
    return [...this.#expectedWords];
  }

  toView() {
    return {
      id: this.id,
      type: 'fill-in-the-blank',
      prompt: this.question,
      gaps: this.gapCount,
      completed: this.isCompleted(),
    };
  }

  toJSON() {
    return {
      type: 'fill-in-the-blank',
      id: this.id,
      question: this.question,
      answers: [...this.#expectedWords],
      completed: this.isCompleted(),
    };
  }

  static fromJSON(data) {
    const q = new FillInTheBlankQuest(data.question, data.answers ?? [], data.id);
    if (data.completed) q._restoreCompleted();
    return q;
  }
}
