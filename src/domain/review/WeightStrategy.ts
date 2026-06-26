import { Quest } from '../quest/Quest';

/** Uma entrada rastreada pela fila de revisão. */
export interface ReviewEntry {
  quest: Quest;
  weight: number;
  lastAttempt: Date;
}

/**
 * Strategy que decide qual quest a fila de revisão apresenta a seguir. A fila
 * delega inteiramente a uma implementação desta interface, portanto nunca precisa
 * saber como os pesos se traduzem em uma escolha.
 */
export interface WeightStrategy {
  select(entries: ReviewEntry[]): Quest | null;
}
