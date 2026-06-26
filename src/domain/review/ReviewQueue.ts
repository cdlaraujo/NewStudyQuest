import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';
import { WeightedRandomStrategy } from './WeightedRandomStrategy';

/**
 * Mantém as quests que o jogador deve revisitar. Cada quest tem um peso; enfileirar
 * a mesma quest novamente *acumula* (soma) seu peso, de modo que erros repetidos
 * a tornam mais provável de reaparecer. A fila não calcula pesos — escolher a
 * próxima quest é delegado a um {@link WeightStrategy} injetado.
 */
export class ReviewQueue {
  readonly #entries: ReviewEntry[] = [];

  constructor(
    private readonly strategy: WeightStrategy = new WeightedRandomStrategy(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  enqueue(quest: Quest, initialWeight: number): void {
    const existing = this.#entries.find((entry) => entry.quest.id === quest.id);
    if (existing) {
      existing.weight += initialWeight; // efeito de acumulação para erros repetidos
      existing.lastAttempt = this.now();
    } else {
      this.#entries.push({ quest, weight: initialWeight, lastAttempt: this.now() });
    }
  }

  getNext(): Quest | null {
    return this.strategy.select(this.#entries);
  }

  size(): number {
    return this.#entries.length;
  }

  isEmpty(): boolean {
    return this.#entries.length === 0;
  }

  /** Snapshot somente-leitura das entradas (usado por testes e presenters). */
  getEntries(): ReadonlyArray<ReviewEntry> {
    return this.#entries;
  }
}
