import { Campanha } from '../../domain/campaign/Campanha';

/**
 * Port para persistência de campanha. Os casos de uso dependem apenas desta
 * interface, nunca de um armazenamento concreto.
 */
export interface CampaignRepository {
  save(campaign: Campanha): void;
  findById(id: string): Campanha | undefined;
}
