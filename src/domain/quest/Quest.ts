import { QuestResult } from './QuestResult';

/** Resposta de quiz é uma string simples; resposta de lacuna é um array. */
export type Answer = string | string[];

/** Projeção para exibição de uma quest (sem vazar respostas). */
export interface QuestView {
  id: string;
  type: string;
  prompt: string;
  gaps?: number;
  options?: string[];
}

/**
 * Base abstrata que todo tipo concreto de questão estende. Ela possui a identidade,
 * o enunciado e a flag de conclusão (imutável externamente), e define o contrato
 * polimórfico: cada subclasse decide como validar a resposta e quanto XP concede.
 * Nenhum código fora da subclasse pergunta "que tipo de quest é essa?" — o objeto
 * responde por si mesmo.
 */
export abstract class Quest {
  #completed = false;

  constructor(
    public readonly id: string,
    public readonly question: string,
  ) {}

  /** Retorna true quando `answer` satisfaz esta quest. */
  abstract validate(answer: Answer): boolean;

  /** XP concedido quando esta quest é respondida corretamente. */
  abstract getXpReward(): number;

  /** A resposta correta, revelada apenas em uma tentativa errada. */
  abstract getCorrectAnswer(): string | string[];

  /** Projeção para exibição usada pela camada de apresentação. */
  abstract toView(): QuestView;

  /**
   * Tenta responder a quest. Em caso de sucesso, a quest é marcada como concluída
   * e um resultado com XP positivo é retornado; em caso de falha, nada muda.
   */
  complete(answer: Answer): QuestResult {
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
  isCompleted(): boolean {
    return this.#completed;
  }
}
