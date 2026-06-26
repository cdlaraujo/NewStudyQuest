import { randomUUID } from 'crypto';
import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../../application/ports/CampaignRepository';

/** Armazenamento de campanhas em memória. Atribui um UUID na primeira vez que uma campanha é salva. */
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
