import { ReviewQueue } from '../../domain/review/ReviewQueue';
import { Quest } from '../../domain/quest/Quest';

/**
 * Retorna a próxima quest para revisão, escolhida pela strategy de peso da fila.
 * Útil quando o jogador quer revisar em vez de avançar.
 */
export class GetNextReview {
  constructor(private readonly reviewQueue: ReviewQueue) {}

  execute(): Quest | null {
    return this.reviewQueue.getNext();
  }
}
