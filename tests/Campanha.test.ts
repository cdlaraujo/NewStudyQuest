import { Campanha } from '../src/domain/campaign/Campanha';
import { Trilha, TrailState } from '../src/domain/trail/Trilha';
import { QuizQuest } from '../src/domain/quest/QuizQuest';

describe('Campanha', () => {
  const buildCampaign = () => {
    const q1 = new QuizQuest('q1', 'a');
    const q2 = new QuizQuest('q2', 'b');
    const trail1 = new Trilha('First', 1, [q1]); // boss vazio
    const trail2 = new Trilha('Second', 2, [q2]);
    const campaign = new Campanha('C', [trail2, trail1]); // intencionalmente fora de ordem
    return { campaign, trail1, trail2, q1 };
  };

  it('ordena trilhas por ordem e auto-desbloqueia ORDEM 1', () => {
    const { campaign, trail1, trail2 } = buildCampaign();

    expect(campaign.getTrails().map((t) => t.order)).toEqual([1, 2]);
    expect(trail1.getState()).toBe(TrailState.UNLOCKED);
    expect(trail2.getState()).toBe(TrailState.LOCKED);
    expect(campaign.getCurrentUnlockedTrail()).toBe(trail1);
  });

  it('não avança enquanto a trilha atual não está concluída', () => {
    const { campaign, trail2 } = buildCampaign();

    expect(campaign.completeCurrentTrail()).toBeUndefined();
    expect(trail2.getState()).toBe(TrailState.LOCKED);
  });

  it('desbloqueia a próxima trilha assim que a atual é concluída', () => {
    const { campaign, trail1, trail2, q1 } = buildCampaign();
    q1.complete('a'); // conclui trail1 (boss vazio)

    const next = campaign.completeCurrentTrail();

    expect(next).toBe(trail2);
    expect(trail1.getState()).toBe(TrailState.COMPLETED);
    expect(trail2.getState()).toBe(TrailState.UNLOCKED);
    expect(campaign.getCurrentUnlockedTrail()).toBe(trail2);
  });
});
