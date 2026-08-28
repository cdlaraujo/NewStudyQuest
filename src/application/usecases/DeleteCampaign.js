/** Remove uma campanha local pelo id. */
export class DeleteCampaign {
  constructor(campaigns) {
    this.campaigns = campaigns;
  }

  execute(campaignId) {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
    this.campaigns.deleteById(campaignId);
  }
}
