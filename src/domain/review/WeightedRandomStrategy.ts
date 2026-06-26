import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';

/**
 * Strategy padrão de revisão: uma loteria ponderada. A chance de uma quest ser
 * escolhida é proporcional ao seu peso, portanto as questões que o jogador
 * continua errando reaparecem com mais frequência. O RNG é injetável para testes
 * determinísticos.
 */
export class WeightedRandomStrategy implements WeightStrategy {
  constructor(private readonly rng: () => number = Math.random) {}

  select(entries: ReviewEntry[]): Quest | null {
    if (entries.length === 0) {
      return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) {
      // todos os pesos são zero — recorre a uma escolha uniforme
      const index = Math.min(entries.length - 1, Math.floor(this.rng() * entries.length));
      return entries[index].quest;
    }

    let roll = this.rng() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) {
        return entry.quest;
      }
    }
    return entries[entries.length - 1].quest;
  }
}
