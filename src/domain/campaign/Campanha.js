import { Trilha, TrailState } from '../trail/Trilha.js';

/**
 * A campanha possui suas trilhas (ordenadas por ordem) e a regra de desbloqueio
 * sequencial. Na construção, a primeira trilha (order: 1) é desbloqueada
 * automaticamente; concluir a trilha atual desbloqueia a próxima. Essa lógica
 * de progressão vive aqui e em nenhum outro lugar.
 */
export class Campanha {
  /** Atribuído pelo repositório quando a campanha é persistida pela primeira vez. */
  id;

  #trails;

  constructor(name, trails, skipAutoUnlock = false) {
    this.name = name;
    this.#trails = [...trails].sort((a, b) => a.order - b.order);

    if (!skipAutoUnlock) {
      const firstTrail = this.#trails.find((trail) => trail.order === 1) ?? this.#trails[0];
      firstTrail?.unlock();
    }
  }

  getTrails() {
    return this.#trails;
  }

  /** A primeira trilha atualmente no estado UNLOCKED, se houver. */
  getCurrentUnlockedTrail() {
    return this.#trails.find((trail) => trail.getState() === TrailState.UNLOCKED);
  }

  /**
   * Se a trilha desbloqueada atual estiver concluída, desbloqueia a próxima por
   * ordem e a retorna. Retorna undefined quando a trilha ainda não está concluída
   * ou não há uma próxima trilha.
   */
  completeCurrentTrail() {
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

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      trails: this.#trails.map((t) => t.toJSON()),
    };
  }

  static fromJSON(data, questFactory) {
    const trails = data.trails.map((t) => Trilha.fromJSON(t, questFactory));
    const campaign = new Campanha(data.name, trails, true);
    campaign.id = data.id;
    return campaign;
  }
}
