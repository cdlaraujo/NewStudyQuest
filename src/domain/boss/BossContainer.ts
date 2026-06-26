import { Answer, Quest } from '../quest/Quest';
import { QuestResult } from '../quest/QuestResult';

/** Fixed reward granted for clearing an entire boss. */
export const BOSS_XP_REWARD = 50;

/**
 * A boss is composition, not inheritance: it is NOT a Quest, it *contains* an
 * ordered list of quests. A private cursor tracks the next question. Answering
 * correctly advances the cursor; a single wrong answer restarts the whole boss
 * from the beginning. Clearing the final question grants a fixed reward. All of
 * this state is self-managed — no caller knows about the cursor or the restart.
 */
export class BossContainer {
  #current = 0;
  #completed = false;
  readonly #quests: Quest[];

  constructor(quests: Quest[] = []) {
    this.#quests = quests;
  }

  get size(): number {
    return this.#quests.length;
  }

  getQuests(): ReadonlyArray<Quest> {
    return this.#quests;
  }

  /** The question the player must answer next (null when the boss is empty). */
  getCurrentQuest(): Quest | null {
    return this.#quests[this.#current] ?? null;
  }

  containsQuest(questId: string): boolean {
    return this.#quests.some((quest) => quest.id === questId);
  }

  /**
   * Attempts the current question. Correct → advance (and, if that was the
   * last one, finish the boss for {@link BOSS_XP_REWARD} XP and reset the
   * cursor). Wrong → restart the whole boss. Intermediate correct answers
   * carry no XP; only clearing the boss does.
   */
  answerNext(answer: Answer): QuestResult {
    if (this.#quests.length === 0) {
      return QuestResult.wrong();
    }

    const result = this.#quests[this.#current].complete(answer);
    if (!result.success) {
      this.#current = 0; // any mistake sends the player back to the start
      return QuestResult.wrong(result.correctAnswer);
    }

    this.#current += 1;
    if (this.#current === this.#quests.length) {
      this.#completed = true;
      this.#current = 0; // ready for a replay if ever needed
      return QuestResult.correct(BOSS_XP_REWARD);
    }
    return QuestResult.correct(0); // progressed, but the boss is not cleared yet
  }

  /** True once the boss has been cleared (empty bosses are trivially complete). */
  isComplete(): boolean {
    return this.#quests.length === 0 || this.#completed;
  }
}
