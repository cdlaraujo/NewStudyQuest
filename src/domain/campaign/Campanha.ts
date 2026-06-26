import { Trilha, TrailState } from '../trail/Trilha';

/**
 * A campanha possui suas trilhas (ordenadas por ordem) e a regra de desbloqueio
 * sequencial. Na construção, a primeira trilha (ORDEM: 1) é desbloqueada
 * automaticamente; concluir a trilha atual desbloqueia a próxima. Essa lógica
 * de progressão vive aqui e em nenhum outro lugar.
 */
export class Campanha {
  /** Atribuído pelo repositório quando a campanha é persistida pela primeira vez. */
  public id?: string;

  readonly #trails: Trilha[];

  constructor(
    public readonly name: string,
    trails: Trilha[],
  ) {
    this.#trails = [...trails].sort((a, b) => a.order - b.order);

    const firstTrail = this.#trails.find((trail) => trail.order === 1) ?? this.#trails[0];
    firstTrail?.unlock();
  }

  getTrails(): ReadonlyArray<Trilha> {
    return this.#trails;
  }

  /** A primeira trilha atualmente no estado UNLOCKED, se houver. */
  getCurrentUnlockedTrail(): Trilha | undefined {
    return this.#trails.find((trail) => trail.getState() === TrailState.UNLOCKED);
  }

  /**
   * Se a trilha desbloqueada atual estiver concluída, desbloqueia a próxima por
   * ordem e a retorna. Retorna undefined quando a trilha ainda não está concluída
   * ou não há uma próxima trilha.
   */
  completeCurrentTrail(): Trilha | undefined {
    const current = this.getCurrentUnlockedTrail();
    if (!current || !current.isCompleted()) {
      return undefined;
    }

    const next = this.#trails.find(
      (trail) => trail.order > current.order && trail.getState() === TrailState.LOCKED,
    );
    if (!next) {
      return undefined;
    }

    next.unlock();
    return next;
  }
}
