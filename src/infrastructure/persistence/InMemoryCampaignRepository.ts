import { randomUUID } from 'crypto';
import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../../application/ports/CampaignRepository';

/** In-memory campaign store. Assigns a UUID the first time a campaign is saved. */
export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly store = new Map<string, Campanha>();

  save(campaign: Campanha): void {
    if (!campaign.id) {
      campaign.id = randomUUID();
    }
    this.store.set(campaign.id, campaign);
  }

  findById(id: string): Campanha | undefined {
    return this.store.get(id);
  }
}
