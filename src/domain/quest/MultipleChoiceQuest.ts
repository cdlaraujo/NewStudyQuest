import { randomUUID } from 'crypto';
import { Answer, Quest, QuestView } from './Quest';

export class MultipleChoiceQuest extends Quest {
  readonly #options: string[];
  readonly #correctIndex: number;

  constructor(question: string, options: string[], correctIndex: number, id: string = randomUUID()) {
    super(id, question);
    this.#options = options;
    this.#correctIndex = correctIndex;
  }

  validate(answer: Answer): boolean {
    return typeof answer === 'string' && parseInt(answer, 10) === this.#correctIndex;
  }

  getXpReward(): number {
    return 10;
  }

  getCorrectAnswer(): string {
    return this.#options[this.#correctIndex];
  }

  toView(): QuestView {
    return {
      id: this.id,
      type: 'multiple-choice',
      prompt: this.question,
      options: this.#options,
    };
  }
}
