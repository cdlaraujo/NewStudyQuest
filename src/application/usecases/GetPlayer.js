import { Player } from '../../domain/player/Player.js';

/** Retorna o único jogador local, criando-o na primeira execução. */
export class GetPlayer {
  constructor(players) {
    this.players = players;
  }

  execute() {
    let player = this.players.get();
    if (!player) {
      player = new Player('local-player');
      this.players.save(player);
    }
    return player;
  }
}
