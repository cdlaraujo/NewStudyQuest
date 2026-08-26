/**
 * Remove uma campanha, mas apenas se pertencer ao jogador solicitante. Um jogador
 * tentando apagar a campanha de outro recebe a mesma mensagem de "não encontrada"
 * que uma campanha inexistente, para não vazar quais ids pertencem a quem.
 */
export class DeleteCampaign {
  constructor(campaigns) {
    this.campaigns = campaigns;
  }

  execute(campaignId, ownerId) {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign || campaign.ownerId !== ownerId) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    this.campaigns.deleteById(campaignId);
  }
}
