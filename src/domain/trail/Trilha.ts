import { Quest } from '../quest/Quest';
import { BossContainer } from '../boss/BossContainer';

export enum TrailState {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  COMPLETED = 'COMPLETED',
}

/**
 * Uma trilha (Trilha) agrupa um conjunto de quests normais mais exatamente um boss,
 * e possui uma pequena máquina de três estados. Ela não sabe nada sobre a campanha
 * à qual pertence — apenas expõe seu próprio estado, quests e boss.
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

  /** LOCKED → UNLOCKED. Desbloquear a partir de qualquer outro estado é um erro de programação. */
  unlock(): void {
    if (this.#state !== TrailState.LOCKED) {
      throw new Error(
        `Cannot unlock trail "${this.name}" from state ${this.#state}; only LOCKED trails can be unlocked.`,
      );
    }
    this.#state = TrailState.UNLOCKED;
  }

  /**
   * True quando todas as quests normais estão concluídas e o boss foi derrotado.
   * Na primeira vez que isso ocorre, a trilha transiciona para COMPLETED. Uma
   * trilha LOCKED nunca pode estar completa.
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
