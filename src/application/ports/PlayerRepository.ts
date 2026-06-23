import { Player } from '../../domain/player/Player';

/**
 * Port for player persistence. Use cases depend only on this interface, never
 * on a concrete store.
 */
export interface PlayerRepository {
  save(player: Player): void;
  findById(id: string): Player | undefined;
}
