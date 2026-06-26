import { LevelResult } from './LevelResult';
import { XpModifier } from './XpModifier';

/** Relógio injetável para que a lógica de streak/bônus seja determinística nos testes. */
export type Clock = () => Date;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const XP_PER_LEVEL = 100;
const STREAK_BONUS_THRESHOLD = 7;

/**
 * O agregado do jogador. Todo campo numérico é um campo verdadeiramente privado (#),
 * portanto XP, nível e streak nunca podem ser atribuídos externamente — eles só
 * mudam pelos métodos abaixo. O Player não contém lógica de "dobrar XP no dia 7";
 * essa regra é fornecida como um {@link XpModifier}.
 */
export class Player {
  #xp = 0;
  #level = 1;
  #streak = 0;
  #lastActiveDate: Date | null = null;
  #streakBonusActive = false;
  #streakBonusExpiry: Date | null = null;
  readonly #clock: Clock;

  constructor(
    public readonly id: string,
    clock: Clock = () => new Date(),
  ) {
    this.#clock = clock;
  }

  getXp(): number {
    return this.#xp;
  }

  getLevel(): number {
    return this.#level;
  }

  getStreak(): number {
    return this.#streak;
  }

  /**
   * A única forma de alterar o XP. Cada modificador é aplicado em sequência ao valor
   * base, o resultado é adicionado ao total acumulado e então o jogador sobe de nível
   * quantas vezes o XP acumulado permitir (limiar = nível * 100).
   */
  addXp(baseXp: number, modifiers: XpModifier[] = []): LevelResult {
    const gained = modifiers.reduce((xp, modifier) => modifier.apply(xp), baseXp);
    this.#xp += gained;

    let didLevelUp = false;
    while (this.#xp >= this.#level * XP_PER_LEVEL) {
      const threshold = this.#level * XP_PER_LEVEL;
      this.#level += 1;
      this.#xp -= threshold;
      didLevelUp = true;
    }

    return new LevelResult(gained, this.#level, didLevelUp);
  }

  /**
   * Registra atividade para "hoje". Atividade no mesmo dia ou no dia seguinte
   * estende o streak; uma ausência de dois ou mais dias o reinicia para 1.
   * Atingir 7 ativa uma janela bônus de 24 horas.
   */
  incrementStreak(): void {
    const now = this.#clock();
    const today = this.#startOfDay(now);

    if (this.#lastActiveDate) {
      const last = this.#startOfDay(this.#lastActiveDate);
      const diffDays = Math.round((today.getTime() - last.getTime()) / MS_PER_DAY);
      this.#streak = diffDays >= 2 ? 1 : this.#streak + 1;
    } else {
      this.#streak = 1;
    }

    this.#lastActiveDate = now;

    if (this.#streak >= STREAK_BONUS_THRESHOLD) {
      this.#streakBonusActive = true;
      this.#streakBonusExpiry = new Date(now.getTime() + MS_PER_DAY);
    }
  }

  resetStreak(): void {
    this.#streak = 0;
    this.#streakBonusActive = false;
    this.#streakBonusExpiry = null;
  }

  /** True enquanto o bônus de streak está ativo e não expirou. */
  isStreakBonusActive(): boolean {
    if (!this.#streakBonusActive || !this.#streakBonusExpiry) {
      return false;
    }
    return this.#clock().getTime() < this.#streakBonusExpiry.getTime();
  }

  #startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
