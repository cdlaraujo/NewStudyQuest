import { LevelResult } from './LevelResult';
import { XpModifier } from './XpModifier';

/** Injectable clock so streak/bonus logic is deterministic under test. */
export type Clock = () => Date;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const XP_PER_LEVEL = 100;
const STREAK_BONUS_THRESHOLD = 7;

/**
 * The player aggregate. Every numeric field is a true private (#) field, so XP,
 * level and streak can never be assigned from outside — they only change
 * through the methods below. The Player holds no "double XP on day 7" logic;
 * that rule is supplied as an {@link XpModifier}.
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
   * The only way to change XP. Each modifier is applied in sequence to the base
   * amount, the result is added to the running total, then the player levels up
   * as many times as the accumulated XP allows (threshold = level * 100).
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
   * Records activity for "today". Same-day or next-day activity extends the
   * streak; a gap of two or more days resets it to 1. Reaching 7 activates a
   * 24-hour bonus window.
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

  /** True while the streak bonus is switched on and has not expired. */
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
