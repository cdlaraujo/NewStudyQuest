import { XpModifier } from './XpModifier';
import { Player } from './Player';

/**
 * Dobra o XP enquanto o bônus de streak do jogador estiver ativo. A regra vive
 * aqui, fora do Player, e é composta em {@link Player.addXp} como um dos
 * modificadores injetados.
 */
export class StreakBonus implements XpModifier {
  constructor(private readonly player: Player) {}

  apply(xp: number): number {
    return this.player.isStreakBonusActive() ? xp * 2 : xp;
  }
}
