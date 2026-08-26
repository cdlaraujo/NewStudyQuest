import { LevelResult } from './LevelResult.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const XP_PER_LEVEL = 100;
const STREAK_BONUS_THRESHOLD = 7;

/**
 * O agregado do jogador. Todo campo numérico é um campo verdadeiramente privado (#),
 * portanto XP, nível e streak nunca podem ser atribuídos externamente — eles só
 * mudam pelos métodos abaixo. O Player não contém lógica de "dobrar XP no dia 7";
 * essa regra é fornecida como um XpModifier.
 */
export class Player {
  #xp = 0;
  #level = 1;
  #streak = 0;
  #lastActiveDate = null;
  #streakBonusActive = false;
  #streakBonusExpiry = null;
  #clock;

  constructor(id, clock = () => new Date()) {
    this.id = id;
    this.#clock = clock;
  }

  getXp() {
    return this.#xp;
  }

  getLevel() {
    return this.#level;
  }

  getStreak() {
    return this.#streak;
  }

  /**
   * A única forma de alterar o XP. Cada modificador é aplicado em sequência ao valor
   * base, o resultado é adicionado ao total acumulado e então o jogador sobe de nível
   * quantas vezes o XP acumulado permitir (limiar = nível * 100).
   */
  addXp(baseXp, modifiers = []) {
    const gained = modifiers.reduce((xp, modifier) => modifier.apply(xp, this), baseXp);
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
  incrementStreak() {
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

  resetStreak() {
    this.#streak = 0;
    this.#streakBonusActive = false;
    this.#streakBonusExpiry = null;
  }

  /** True enquanto o bônus de streak está ativo e não expirou. */
  isStreakBonusActive() {
    if (!this.#streakBonusActive || !this.#streakBonusExpiry) {
      return false;
    }
    return this.#clock().getTime() < this.#streakBonusExpiry.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      xp: this.#xp,
      level: this.#level,
      streak: this.#streak,
      lastActiveDate: this.#lastActiveDate ? this.#lastActiveDate.toISOString() : null,
      streakBonusActive: this.#streakBonusActive,
      streakBonusExpiry: this.#streakBonusExpiry ? this.#streakBonusExpiry.toISOString() : null,
    };
  }

  static fromJSON(data, clock = () => new Date()) {
    const p = new Player(data.id, clock);
    p.#xp = data.xp;
    p.#level = data.level;
    p.#streak = data.streak;
    p.#lastActiveDate = data.lastActiveDate ? new Date(data.lastActiveDate) : null;
    p.#streakBonusActive = data.streakBonusActive;
    p.#streakBonusExpiry = data.streakBonusExpiry ? new Date(data.streakBonusExpiry) : null;
    return p;
  }

  #startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
