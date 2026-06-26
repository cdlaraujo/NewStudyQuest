import { Campanha } from '../../domain/campaign/Campanha';
import { CampaignRepository } from '../ports/CampaignRepository';

/**
 * Port para o que quer que converta texto de marcação bruto em uma campanha.
 * Definido aqui para que o caso de uso dependa de uma abstração; o parser
 * concreto vive na infraestrutura.
 */
export interface CampaignTextParser {
  parse(rawText: string): Campanha;
}

/**
 * Analisa o texto formatado pelo chatbot em uma campanha e a persiste. O
 * backend nunca chama um LLM — ele apenas analisa o texto que o estudante
 * já produziu com um chatbot externo.
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
