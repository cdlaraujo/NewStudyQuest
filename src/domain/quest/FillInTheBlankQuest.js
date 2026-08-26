import { randomUUID } from 'crypto';
import { Quest } from './Quest.js';
import { normalize } from '../shared/normalize.js';

const GAP_PATTERN = /\{([^}]*)\}/g;

/**
 * Frase com uma ou mais lacunas escritas entre chaves, ex.:
 * "O {núcleo} armazena DNA.". Na construção, as palavras esperadas são
 * extraídas em ordem; a frase original é mantida para exibição.
 */
export class FillInTheBlankQuest extends Quest {
  #expectedWords;

  constructor(sentence, id = randomUUID()) {
    super(id, sentence);
    this.#expectedWords = FillInTheBlankQuest.extractGaps(sentence);
  }

  /** Extrai as palavras dentro de `{}` de uma frase, preservando a ordem. */
  static extractGaps(sentence) {
    const matches = sentence.match(GAP_PATTERN) ?? [];
    return matches.map((match) => match.slice(1, -1).trim());
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
      prompt: this.question.replace(GAP_PATTERN, '_____'),
      gaps: this.gapCount,
    };
  }

  toJSON() {
    return { type: 'fill-in-the-blank', id: this.id, question: this.question, completed: this.isCompleted() };
  }

  static fromJSON(data) {
    const q = new FillInTheBlankQuest(data.question, data.id);
    if (data.completed) q._restoreCompleted();
    return q;
  }
}
