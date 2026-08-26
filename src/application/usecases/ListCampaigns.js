/** Lista as campanhas de um jogador para a antesala (tela de "campanhas anteriores"). */
export class ListCampaigns {
  constructor(campaigns) {
    this.campaigns = campaigns;
  }

  execute(ownerId) {
    return this.campaigns.findAllByOwner(ownerId);
  }
}
