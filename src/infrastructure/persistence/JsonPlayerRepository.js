import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Player } from '../../domain/player/Player.js';

/**
 * Armazena todos os jogadores em disco (JSON), um arquivo por repositório.
 * Mesmo padrão Map + flush do JsonCampaignRepository, para que múltiplos
 * jogadores concorrentes sejam suportados sem qualquer estado escondido.
 */
export class JsonPlayerRepository {
  #store = new Map();

  constructor(filePath, clock = () => new Date()) {
    this.filePath = filePath;
    this.clock = clock;
    this.load();
  }

  save(player) {
    this.#store.set(player.id, player);
    this.flush();
  }

  findById(id) {
    return this.#store.get(id);
  }

  load() {
    if (!existsSync(this.filePath)) {
      return;
    }
    const entries = JSON.parse(readFileSync(this.filePath, 'utf-8'));
    for (const snapshot of entries) {
      this.#store.set(snapshot.id, Player.fromJSON(snapshot, this.clock));
    }
  }

  flush() {
    const snapshots = [...this.#store.values()].map((p) => p.toJSON());
    writeFileSync(this.filePath, JSON.stringify(snapshots, null, 2), 'utf-8');
  }
}
