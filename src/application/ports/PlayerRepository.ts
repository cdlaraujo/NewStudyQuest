import { Player } from '../../domain/player/Player';

/**
 * Port para persistência do jogador. Os casos de uso dependem apenas desta
 * interface, nunca de um armazenamento concreto.
 */
export interface PlayerRepository {
  save(player: Player): void;
  findById(id: string): Player | undefined;
}
