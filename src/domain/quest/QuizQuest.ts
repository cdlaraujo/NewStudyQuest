import { randomUUID } from 'crypto';
import { Answer, Quest, QuestView } from './Quest';
import { normalize } from '../shared/normalize';

/**
 * A single-answer multiple-knowledge question. The expected answer is stored
 * privately and compared after normalisation so that casing and surrounding
 * whitespace never matter.
 */
export class QuizQuest extends Quest {
  readonly #answer: string;

  constructor(question: string, answer: string, id: string = randomUUID()) {
    super(id, question);
    this.#answer = answer;
  }

  validate(answer: Answer): boolean {
    if (typeof answer !== 'string') {
      return false;
    }
    return normalize(answer) === normalize(this.#answer);
  }

  getXpReward(): number {
    return 10;
  }

  toView(): QuestView {
    return { id: this.id, type: 'quiz', prompt: this.question };
  }
}
