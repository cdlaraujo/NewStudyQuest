import { Answer, Quest } from '../quest/Quest';
import { QuestResult } from '../quest/QuestResult';

/** Recompensa fixa concedida por derrotar um boss inteiro. */
export const BOSS_XP_REWARD = 50;

/**
 * Um boss é composição, não herança: NÃO é uma Quest, ele *contém* uma lista
 * ordenada de quests. Um cursor privado rastreia a próxima pergunta. Responder
 * corretamente avança o cursor; uma única resposta errada reinicia o boss do
 * início. Concluir a última pergunta concede uma recompensa fixa. Todo esse
 * estado é autogerenciado — nenhum chamador sabe sobre o cursor ou o reinício.
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

  /** A pergunta que o jogador deve responder a seguir (null quando o boss está vazio). */
  getCurrentQuest(): Quest | null {
    return this.#quests[this.#current] ?? null;
  }

  containsQuest(questId: string): boolean {
    return this.#quests.some((quest) => quest.id === questId);
  }

  /**
   * Tenta responder a pergunta atual. Correto → avança (e, se for a última,
   * conclui o boss com {@link BOSS_XP_REWARD} XP e reinicia o cursor). Errado →
   * reinicia o boss inteiro. Respostas corretas intermediárias não concedem XP;
   * apenas derrotar o boss concede.
   */
  answerNext(answer: Answer): QuestResult {
    if (this.#quests.length === 0) {
      return QuestResult.wrong();
    }

    const result = this.#quests[this.#current].complete(answer);
    if (!result.success) {
      this.#current = 0; // qualquer erro manda o jogador de volta ao início
      return QuestResult.wrong(result.correctAnswer);
    }

    this.#current += 1;
    if (this.#current === this.#quests.length) {
      this.#completed = true;
      this.#current = 0; // pronto para replay, se necessário
      return QuestResult.correct(BOSS_XP_REWARD);
    }
    return QuestResult.correct(0); // avançou, mas o boss ainda não foi derrotado
  }

  /** True após o boss ser derrotado (bosses vazios são trivialmente completos). */
  isComplete(): boolean {
    return this.#quests.length === 0 || this.#completed;
  }
}
