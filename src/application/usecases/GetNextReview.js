/** Retorna a próxima quest da fila de revisão da sessão. */
export class GetNextReview {
  constructor(reviewQueue) {
    this.reviewQueue = reviewQueue;
  }

  execute() {
    return this.reviewQueue.getNext();
  }
}
