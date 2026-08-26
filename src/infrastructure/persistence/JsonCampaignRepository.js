import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { Campanha } from '../../domain/campaign/Campanha.js';
import { QuizQuest } from '../../domain/quest/QuizQuest.js';
import { FillInTheBlankQuest } from '../../domain/quest/FillInTheBlankQuest.js';
import { MultipleChoiceQuest } from '../../domain/quest/MultipleChoiceQuest.js';

function questFromSnapshot(data) {
  switch (data.type) {
    case 'quiz': return QuizQuest.fromJSON(data);
    case 'fill-in-the-blank': return FillInTheBlankQuest.fromJSON(data);
    case 'multiple-choice': return MultipleChoiceQuest.fromJSON(data);
    default: throw new Error(`Unknown quest type: ${data.type}`);
  }
}

/** Armazenamento de campanhas em disco (JSON). Mantém um arquivo por repositório. */
export class JsonCampaignRepository {
  #store = new Map();

  constructor(filePath) {
    this.filePath = filePath;
    this.load();
  }

  save(campaign) {
    if (!campaign.id) {
      campaign.id = randomUUID();
    }
    this.#store.set(campaign.id, campaign);
    this.flush();
  }

  findById(id) {
    return this.#store.get(id);
  }

  findAllByOwner(ownerId) {
    return [...this.#store.values()].filter((c) => c.ownerId === ownerId);
  }

  deleteById(id) {
    this.#store.delete(id);
    this.flush();
  }

  load() {
    if (!existsSync(this.filePath)) {
      return;
    }
    const entries = JSON.parse(readFileSync(this.filePath, 'utf-8'));
    for (const snapshot of entries) {
      const campaign = Campanha.fromJSON(snapshot, questFromSnapshot);
      if (campaign.id) {
        this.#store.set(campaign.id, campaign);
      }
    }
  }

  flush() {
    const snapshots = [...this.#store.values()].map((c) => c.toJSON());
    writeFileSync(this.filePath, JSON.stringify(snapshots, null, 2), 'utf-8');
  }
}
