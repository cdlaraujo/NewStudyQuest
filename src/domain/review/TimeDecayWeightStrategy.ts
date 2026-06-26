import { Quest } from '../quest/Quest';
import { ReviewEntry, WeightStrategy } from './WeightStrategy';
import { WeightedRandomStrategy } from './WeightedRandomStrategy';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Strategy que primeiro envelhece a fila — aumentando o peso de cada entrada
 * em proporção aos dias inteiros decorridos desde a última tentativa — e então
 * delega a escolha real a outra strategy (uma loteria ponderada por padrão).
 * Isso faz questões negligenciadas por muito tempo ressurgirem.
 */
export class TimeDecayWeightStrategy implements WeightStrategy {
  constructor(
    private readonly decayPerDay: number = 1,
    private readonly now: () => Date = () => new Date(),
    private readonly selector: WeightStrategy = new WeightedRandomStrategy(),
  ) {}

  /**
   * Aumenta o peso de cada entrada por `diasDesdeÚltimaTentativa * decayPerDay`
   * e atualiza seu `lastAttempt`. Exposto separadamente para que o comportamento
   * de envelhecimento possa ser verificado diretamente.
   */
  applyDecay(entries: ReviewEntry[]): void {
    const current = this.now();
    for (const entry of entries) {
      const days = Math.floor((current.getTime() - entry.lastAttempt.getTime()) / MS_PER_DAY);
      if (days > 0) {
        entry.weight += days * this.decayPerDay;
        entry.lastAttempt = current;
      }
    }
  }

  select(entries: ReviewEntry[]): Quest | null {
    this.applyDecay(entries);
    return this.selector.select(entries);
  }
}
