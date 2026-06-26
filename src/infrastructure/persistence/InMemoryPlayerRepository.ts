import { Player } from '../../domain/player/Player';
import { PlayerRepository } from '../../application/ports/PlayerRepository';

export const DEFAULT_PLAYER_ID = 'player-1';

/**
 * Mantém o único jogador. O sistema não possui autenticação, portanto tudo
 * acontece como "player-1", começando no nível 1 com 0 XP e streak 0.
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
