import { XpModifier } from './XpModifier';
import { Player } from './Player';

/**
 * Doubles XP while the player's streak bonus is active. The rule lives here,
 * outside the Player, and is composed into {@link Player.addXp} as one of the
 * injected modifiers.
 */
export class StreakBonus implements XpModifier {
  constructor(private readonly player: Player) {}

  apply(xp: number): number {
    return this.player.isStreakBonusActive() ? xp * 2 : xp;
  }
}
