import { QuestResult } from './QuestResult.js';

/**
 * Base que todo tipo concreto de questão estende. Ela possui a identidade,
 * o enunciado e a flag de conclusão (imutável externamente), e define o contrato
 * polimórfico: cada subclasse decide como validar a resposta e quanto XP concede.
 * Nenhum código fora da subclasse pergunta "que tipo de quest é essa?" — o objeto
 * responde por si mesmo.
 */
export class Quest {
  #completed = false;

  constructor(id, question) {
    this.id = id;
    this.question = question;
  }

  /** Retorna true quando `answer` satisfaz esta quest. Subclasses devem sobrescrever. */
  validate(_answer) {
    throw new Error('not implemented');
  }

  /** XP concedido quando esta quest é respondida corretamente. Subclasses devem sobrescrever. */
  getXpReward() {
    throw new Error('not implemented');
  }

  /** A resposta correta, revelada apenas em uma tentativa errada. Subclasses devem sobrescrever. */
  getCorrectAnswer() {
    throw new Error('not implemented');
  }

  /** Projeção para exibição usada pela camada de apresentação. Subclasses devem sobrescrever. */
  toView() {
    throw new Error('not implemented');
  }

  /** Serialização para persistência em disco. Subclasses devem sobrescrever. */
  toJSON() {
    throw new Error('not implemented');
  }

  /**
   * Tenta responder a quest. Em caso de sucesso, a quest é marcada como concluída
   * e um resultado com XP positivo é retornado; em caso de falha, nada muda.
   */
  complete(answer) {
    if (this.#completed) {
      return this.validate(answer) ? new QuestResult(true, 0) : QuestResult.wrong(this.getCorrectAnswer());
    }
    if (this.validate(answer)) {
      this.#completed = true;
      return new QuestResult(true, this.getXpReward());
    }
    return QuestResult.wrong(this.getCorrectAnswer());
  }

  /** Visão somente-leitura da flag de conclusão; nunca pode ser definida externamente. */
  isCompleted() {
    return this.#completed;
  }

  /** Restaura o estado de conclusão ao desserializar do disco. */
  _restoreCompleted() {
    this.#completed = true;
  }
}
