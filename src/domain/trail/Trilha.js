import { BossContainer } from '../boss/BossContainer.js';

export const TrailState = Object.freeze({
  LOCKED: 'LOCKED',
  UNLOCKED: 'UNLOCKED',
  COMPLETED: 'COMPLETED',
});

/**
 * Uma trilha (Trilha) agrupa um conjunto de quests normais mais exatamente um boss,
 * e possui uma pequena máquina de três estados. Ela não sabe nada sobre a campanha
 * à qual pertence — apenas expõe seu próprio estado, quests e boss.
 */
export class Trilha {
  #state = TrailState.LOCKED;
  #quests;
  #boss;

  constructor(name, order, quests, boss = new BossContainer()) {
    this.name = name;
    this.order = order;
    this.#quests = quests;
    this.#boss = boss;
  }

  getState() {
    return this.#state;
  }

  getQuests() {
    return this.#quests;
  }

  getBoss() {
    return this.#boss;
  }

  findQuest(questId) {
    return this.#quests.find((quest) => quest.id === questId);
  }

  /** LOCKED → UNLOCKED. Desbloquear a partir de qualquer outro estado é um erro de programação. */
  unlock() {
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
  isCompleted() {
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

  toJSON() {
    return {
      name: this.name,
      order: this.order,
      state: this.#state,
      quests: this.#quests.map((q) => q.toJSON()),
      boss: this.#boss.toJSON(),
    };
  }

  static fromJSON(data, questFactory) {
    const quests = data.quests.map(questFactory);
    const boss = BossContainer.fromJSON(data.boss, questFactory);
    const trail = new Trilha(data.name, data.order, quests, boss);
    trail.#state = data.state;
    return trail;
  }
}
