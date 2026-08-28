/** Analisa o JSON produzido pelo chatbot em uma campanha e a persiste localmente. */
export class GenerateCampaign {
  constructor(parser, campaigns) {
    this.parser = parser;
    this.campaigns = campaigns;
  }

  execute(rawText) {
    const campaign = this.parser.parse(rawText);
    this.campaigns.save(campaign);
    return campaign;
  }
}
