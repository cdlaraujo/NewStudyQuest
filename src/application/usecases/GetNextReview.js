/**
 * Retorna a próxima quest para revisão, escolhida pela strategy de peso da fila
 * do jogador. Útil quando o jogador quer revisar em vez de avançar.
 */
export class GetNextReview {
  constructor(getReviewQueue) {
    this.getReviewQueue = getReviewQueue;
  }

  execute(playerId) {
    return this.getReviewQueue(playerId).getNext();
  }
}
