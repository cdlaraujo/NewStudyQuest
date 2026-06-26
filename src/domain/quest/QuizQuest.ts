import { randomUUID } from 'crypto';
import { Answer, Quest, QuestView } from './Quest';
import { normalize } from '../shared/normalize';

/**
 * Questão de resposta única. A resposta esperada é armazenada de forma privada
 * e comparada após normalização, de modo que maiúsculas/minúsculas e espaços
 * ao redor nunca importam.
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

  getCorrectAnswer(): string {
    return this.#answer;
  }

  toView(): QuestView {
    return { id: this.id, type: 'quiz', prompt: this.question };
  }
}
