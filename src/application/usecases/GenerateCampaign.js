/**
 * Analisa o texto formatado pelo chatbot em uma campanha e a persiste. O
 * backend nunca chama um LLM — ele apenas analisa o texto que o estudante
 * já produziu com um chatbot externo.
 */
export class GenerateCampaign {
  constructor(parser, campaigns) {
    this.parser = parser;
    this.campaigns = campaigns;
  }

  execute(rawText, ownerId) {
    const campaign = this.parser.parse(rawText);
    campaign.ownerId = ownerId;
    this.campaigns.save(campaign);
    return campaign;
  }
}
