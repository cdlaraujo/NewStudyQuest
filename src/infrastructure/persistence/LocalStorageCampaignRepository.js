import { Campanha } from '../../domain/campaign/Campanha.js';
import { QuizQuest } from '../../domain/quest/QuizQuest.js';
import { FillInTheBlankQuest } from '../../domain/quest/FillInTheBlankQuest.js';
import { MultipleChoiceQuest } from '../../domain/quest/MultipleChoiceQuest.js';
import { createId } from '../../domain/shared/createId.js';

function questFromSnapshot(data) {
  switch (data.type) {
    case 'quiz': return QuizQuest.fromJSON(data);
    case 'fill-in-the-blank': return FillInTheBlankQuest.fromJSON(data);
    case 'multiple-choice': return MultipleChoiceQuest.fromJSON(data);
    default: throw new Error(`Unknown quest type: ${data.type}`);
  }
}

/** Persistência local de campanhas no navegador. */
export class LocalStorageCampaignRepository {
  #store = new Map();

  constructor(storage = globalThis.localStorage, key = 'eduquest_campaigns') {
    this.storage = storage;
    this.key = key;
    this.load();
  }

  save(campaign) {
    if (!campaign.id) campaign.id = createId();
    this.#store.set(campaign.id, campaign);
    this.flush();
  }

  findById(id) {
    return this.#store.get(id);
  }

  findAll() {
    return [...this.#store.values()];
  }

  deleteById(id) {
    this.#store.delete(id);
    this.flush();
  }

  load() {
    const raw = this.storage?.getItem(this.key);
    if (!raw) return;
    try {
      const entries = JSON.parse(raw);
      for (const snapshot of entries) {
        const campaign = Campanha.fromJSON(snapshot, questFromSnapshot);
        if (campaign.id) this.#store.set(campaign.id, campaign);
      }
    } catch {
      // Um save local corrompido não deve impedir o app de abrir.
      this.#store.clear();
    }
  }

  flush() {
    const snapshots = [...this.#store.values()].map((campaign) => campaign.toJSON());
    this.storage?.setItem(this.key, JSON.stringify(snapshots));
  }
}
