import { GenerateCampaign } from '../src/application/usecases/GenerateCampaign';
import { CampaignParser } from '../src/infrastructure/parser/CampaignParser';
import { InMemoryCampaignRepository } from '../src/infrastructure/persistence/InMemoryCampaignRepository';

const TEXT = `CAMPANHA: Demo
TRILHA: Intro
ORDEM: 1
Q: 2 + 2?
R: 4`;

describe('GenerateCampaign', () => {
  it('analisa o texto e persiste a campanha no repositório', () => {
    const repo = new InMemoryCampaignRepository();
    const useCase = new GenerateCampaign(new CampaignParser(), repo);

    const campaign = useCase.execute(TEXT);

    expect(campaign.id).toBeDefined();
    expect(campaign.name).toBe('Demo');
    expect(repo.findById(campaign.id!)).toBe(campaign);
  });
});
