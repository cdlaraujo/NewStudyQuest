/**
 * Dobra o XP enquanto o bônus de streak do jogador estiver ativo. A regra vive
 * aqui, fora do Player, e é composta em {@link Player.addXp} como um dos
 * modificadores injetados. Stateless: o jogador vem por parâmetro em cada
 * chamada, então a mesma instância pode ser reutilizada por qualquer jogador.
 */
export class StreakBonus {
  apply(xp, player) {
    return player.isStreakBonusActive() ? xp * 2 : xp;
  }
}
