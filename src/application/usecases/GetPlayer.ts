import { Player } from '../../domain/player/Player';
import { PlayerRepository } from '../ports/PlayerRepository';

/** Retorna o jogador atual para que a UI possa exibir o HUD de XP/nível/streak em tempo real. */
export class GetPlayer {
  constructor(
    private readonly players: PlayerRepository,
    private readonly playerId: string = 'player-1',
  ) {}

  execute(): Player {
    const player = this.players.findById(this.playerId);
    if (!player) {
      throw new Error(`Player ${this.playerId} not found`);
    }
    return player;
  }
}
