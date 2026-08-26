/** Retorna o jogador atual para que a UI possa exibir o HUD de XP/nível/streak em tempo real. */
export class GetPlayer {
  constructor(players) {
    this.players = players;
  }

  execute(playerId) {
    const player = this.players.findById(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    return player;
  }
}
