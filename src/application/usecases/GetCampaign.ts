import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../ports/CampaignRepository';

/** Carrega uma campanha por id para que a UI possa atualizar os estados das trilhas após respostas. */
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
