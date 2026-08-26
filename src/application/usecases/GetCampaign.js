/** Carrega uma campanha por id para que a UI possa atualizar os estados das trilhas após respostas. */
export class GetCampaign {
  constructor(campaigns) {
    this.campaigns = campaigns;
  }

  execute(campaignId) {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    return campaign;
  }
}
