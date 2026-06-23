import { Player } from '../../domain/player/Player';
import { PlayerRepository } from '../../application/ports/PlayerRepository';

export const DEFAULT_PLAYER_ID = 'player-1';

/**
 * Holds the single player. The system has no auth, so everything happens as
 * "player-1", starting at level 1 with 0 XP and a 0 streak.
 */
export class InMemoryPlayerRepository implements PlayerRepository {
  private player: Player;

  constructor(player: Player = new Player(DEFAULT_PLAYER_ID)) {
    this.player = player;
  }

  save(player: Player): void {
    this.player = player;
  }

  findById(id: string): Player | undefined {
    return this.player.id === id ? this.player : undefined;
  }
}
