import { randomUUID } from 'crypto';
import { Answer, Quest, QuestView } from './Quest';
import { normalize } from '../shared/normalize';

const GAP_PATTERN = /\{([^}]*)\}/g;

/**
 * A sentence with one or more gaps written in curly braces, e.g.
 * "The {nucleus} stores DNA.". On construction the expected words are
 * extracted in order; the original sentence is kept for display.
 */
export class FillInTheBlankQuest extends Quest {
  readonly #expectedWords: string[];

  constructor(sentence: string, id: string = randomUUID()) {
    super(id, sentence);
    this.#expectedWords = FillInTheBlankQuest.extractGaps(sentence);
  }

  /** Pulls the words inside `{}` out of a sentence, preserving their order. */
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

  toView(): QuestView {
    return {
      id: this.id,
      type: 'fill-in-the-blank',
      prompt: this.question.replace(GAP_PATTERN, '_____'),
      gaps: this.gapCount,
    };
  }
}
