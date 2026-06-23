import { GetCampaign } from '../src/application/usecases/GetCampaign';
import { InMemoryCampaignRepository } from '../src/infrastructure/persistence/InMemoryCampaignRepository';
import { CampaignParser } from '../src/infrastructure/parser/CampaignParser';

const TEXT = `CAMPANHA: Demo
TRILHA: Intro
ORDEM: 1
Q: 2 + 2?
R: 4`;

describe('GetCampaign', () => {
  it('returns a saved campaign by id', () => {
    const repo = new InMemoryCampaignRepository();
    const campaign = new CampaignParser().parse(TEXT);
    repo.save(campaign);
    const useCase = new GetCampaign(repo);

    expect(useCase.execute(campaign.id!)).toBe(campaign);
  });

  it('throws for an unknown id', () => {
    const useCase = new GetCampaign(new InMemoryCampaignRepository());

    expect(() => useCase.execute('nope')).toThrow();
  });
});
