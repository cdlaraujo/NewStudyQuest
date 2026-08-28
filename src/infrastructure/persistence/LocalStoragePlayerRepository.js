import { Player } from '../../domain/player/Player.js';

/** Persistência do único jogador local do EduQuest. */
export class LocalStoragePlayerRepository {
  constructor(storage = globalThis.localStorage, key = 'eduquest_player', clock = () => new Date()) {
    this.storage = storage;
    this.key = key;
    this.clock = clock;
    this.player = this.load();
  }

  get() {
    return this.player;
  }

  save(player) {
    this.player = player;
    this.storage?.setItem(this.key, JSON.stringify(player.toJSON()));
  }

  load() {
    const raw = this.storage?.getItem(this.key);
    if (!raw) return null;
    try {
      return Player.fromJSON(JSON.parse(raw), this.clock);
    } catch {
      return null;
    }
  }
}
