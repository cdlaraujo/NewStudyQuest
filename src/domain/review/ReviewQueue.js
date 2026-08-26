import { WeightedRandomStrategy } from './WeightedRandomStrategy.js';

/**
 * Mantém as quests que o jogador deve revisitar. Cada quest tem um peso; enfileirar
 * a mesma quest novamente *acumula* (soma) seu peso, de modo que erros repetidos
 * a tornam mais provável de reaparecer. A fila não calcula pesos — escolher a
 * próxima quest é delegado a uma strategy injetada.
 */
export class ReviewQueue {
  #entries = [];
  #strategy;
  #now;

  constructor(strategy = new WeightedRandomStrategy(), now = () => new Date()) {
    this.#strategy = strategy;
    this.#now = now;
  }

  enqueue(quest, initialWeight) {
    const existing = this.#entries.find((entry) => entry.quest.id === quest.id);
    if (existing) {
      existing.weight += initialWeight; // efeito de acumulação para erros repetidos
      existing.lastAttempt = this.#now();
    } else {
      this.#entries.push({ quest, weight: initialWeight, lastAttempt: this.#now() });
    }
  }

  getNext() {
    return this.#strategy.select(this.#entries);
  }

  size() {
    return this.#entries.length;
  }

  isEmpty() {
    return this.#entries.length === 0;
  }

  /** Snapshot somente-leitura das entradas (usado por testes e presenters). */
  getEntries() {
    return this.#entries;
  }
}
