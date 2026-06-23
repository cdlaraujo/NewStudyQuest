import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../ports/CampaignRepository';

/** Loads a campaign by id so the UI can refresh trail states after answers. */
export class GetCampaign {
  constructor(private readonly campaigns: CampaignRepository) {}

  execute(campaignId: string): Campanha {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    return campaign;
  }
}
