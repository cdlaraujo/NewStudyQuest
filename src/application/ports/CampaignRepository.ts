import { Campanha } from '../../domain/campaign/Campanha';

/**
 * Port for campaign persistence. Use cases depend only on this interface, never
 * on a concrete store.
 */
export interface CampaignRepository {
  save(campaign: Campanha): void;
  findById(id: string): Campanha | undefined;
}
