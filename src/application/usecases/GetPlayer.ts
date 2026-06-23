import { Player } from '../../domain/player/Player';
import { PlayerRepository } from '../ports/PlayerRepository';

/** Returns the current player so the UI can show a live XP/level/streak HUD. */
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
