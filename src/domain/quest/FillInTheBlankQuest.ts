import { randomUUID } from 'crypto';
import { Answer, Quest, QuestView } from './Quest';
import { normalize } from '../shared/normalize';

const GAP_PATTERN = /\{([^}]*)\}/g;

/**
 * Frase com uma ou mais lacunas escritas entre chaves, ex.:
 * "O {núcleo} armazena DNA.". Na construção, as palavras esperadas são
 * extraídas em ordem; a frase original é mantida para exibição.
 */
export class FillInTheBlankQuest extends Quest {
  readonly #expectedWords: string[];

  constructor(sentence: string, id: string = randomUUID()) {
    super(id, sentence);
    this.#expectedWords = FillInTheBlankQuest.extractGaps(sentence);
  }

  /** Extrai as palavras dentro de `{}` de uma frase, preservando a ordem. */
  static extractGaps(sentence: string): string[] {
    const matches = sentence.match(GAP_PATTERN) ?? [];
    return matches.map((match) => match.slice(1, -1).trim());
  }

  get gapCount(): number {
    return this.#expectedWords.length;
  }

  validate(answer: Answer): boolean {
    if (!Array.isArray(answer) || answer.length !== this.#expectedWords.length) {
      return false;
    }
    return this.#expectedWords.every(
      (word, index) => normalize(word) === normalize(answer[index] ?? ''),
    );
  }

  getXpReward(): number {
    return 15;
  }

  getCorrectAnswer(): string[] {
    return [...this.#expectedWords];
  }

  toView(): QuestView {
    return {
      id: this.id,
      type: 'fill-in-the-blank',
      prompt: this.question.replace(GAP_PATTERN, '_____'),
      gaps: this.gapCount,
    };
  }
}
