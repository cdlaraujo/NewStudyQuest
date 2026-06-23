import { Quest } from '../quest/Quest';
import { BossContainer } from '../boss/BossContainer';

export enum TrailState {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  COMPLETED = 'COMPLETED',
}

/**
 * A trail (Trilha) groups a set of regular quests plus exactly one boss, and
 * owns a small three-state machine. It knows nothing about the campaign it
 * belongs to — it only exposes its own state, quests and boss.
 */
export class Trilha {
  #state: TrailState = TrailState.LOCKED;
  readonly #quests: Quest[];
  readonly #boss: BossContainer;

  constructor(
    public readonly name: string,
    public readonly order: number,
    quests: Quest[],
    boss: BossContainer = new BossContainer(),
  ) {
    this.#quests = quests;
    this.#boss = boss;
  }

  getState(): TrailState {
    return this.#state;
  }

  getQuests(): ReadonlyArray<Quest> {
    return this.#quests;
  }

  getBoss(): BossContainer {
    return this.#boss;
  }

  findQuest(questId: string): Quest | undefined {
    return this.#quests.find((quest) => quest.id === questId);
  }

  /** LOCKED → UNLOCKED. Unlocking from any other state is a programming error. */
  unlock(): void {
    if (this.#state !== TrailState.LOCKED) {
      throw new Error(
        `Cannot unlock trail "${this.name}" from state ${this.#state}; only LOCKED trails can be unlocked.`,
      );
    }
    this.#state = TrailState.UNLOCKED;
  }

  /**
   * True when every regular quest is completed and the boss is cleared. The
   * first time this holds the trail transitions to COMPLETED. A LOCKED trail
   * can never be complete.
   */
  isCompleted(): boolean {
    if (this.#state === TrailState.COMPLETED) {
      return true;
    }
    if (this.#state === TrailState.LOCKED) {
      return false;
    }
    const allQuestsDone = this.#quests.every((quest) => quest.isCompleted());
    if (allQuestsDone && this.#boss.isComplete()) {
      this.#state = TrailState.COMPLETED;
      return true;
    }
    return false;
  }
}
