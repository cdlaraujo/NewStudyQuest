import { Trilha, TrailState } from '../trail/Trilha';

/**
 * A campaign owns its trails (sorted by order) and the sequential-unlocking
 * rule. On construction the first trail (ORDEM: 1) is unlocked automatically;
 * finishing the current trail unlocks the next one. That progression logic
 * lives here and nowhere else.
 */
export class Campanha {
  /** Assigned by the repository when the campaign is first persisted. */
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

  /** The first trail currently in the UNLOCKED state, if any. */
  getCurrentUnlockedTrail(): Trilha | undefined {
    return this.#trails.find((trail) => trail.getState() === TrailState.UNLOCKED);
  }

  /**
   * If the current unlocked trail is complete, unlock the next trail by order
   * and return it. Returns undefined when the trail is not complete yet or
   * there is no further trail.
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
