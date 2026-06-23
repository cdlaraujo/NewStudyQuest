import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../ports/CampaignRepository';

/**
 * Port for whatever turns raw markup text into a campaign. Defined here so the
 * use case depends on an abstraction; the concrete parser lives in
 * infrastructure.
 */
export interface CampaignTextParser {
  parse(rawText: string): Campanha;
}

/**
 * Parses the chatbot-formatted text into a campaign and persists it. The
 * backend never calls an LLM — it only parses text the student already
 * produced with an external chatbot.
 */
export class GenerateCampaign {
  constructor(
    private readonly parser: CampaignTextParser,
    private readonly campaigns: CampaignRepository,
  ) {}

  execute(rawText: string): Campanha {
    const campaign = this.parser.parse(rawText);
    this.campaigns.save(campaign);
    return campaign;
  }
}
