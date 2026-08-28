/** Lista as campanhas salvas neste dispositivo. */
export class ListCampaigns {
  constructor(campaigns) {
    this.campaigns = campaigns;
  }

  execute() {
    return this.campaigns.findAll();
  }
}
