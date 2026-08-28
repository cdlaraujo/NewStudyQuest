import test from 'node:test';
import assert from 'node:assert/strict';

import { JsonCampaignParser } from '../src/infrastructure/parser/JsonCampaignParser.js';
import { LocalStorageCampaignRepository } from '../src/infrastructure/persistence/LocalStorageCampaignRepository.js';
import { LocalStoragePlayerRepository } from '../src/infrastructure/persistence/LocalStoragePlayerRepository.js';
import { AnswerQuest } from '../src/application/usecases/AnswerQuest.js';
import { ReviewQueue } from '../src/domain/review/ReviewQueue.js';
import { WeightedRandomStrategy } from '../src/domain/review/WeightedRandomStrategy.js';
import { BossContainer, BOSS_XP_REWARD } from '../src/domain/boss/BossContainer.js';
import { QuizQuest } from '../src/domain/quest/QuizQuest.js';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
}

const validCampaign = {
  version: 1,
  name: 'Demo',
  trails: [
    {
      name: 'Primeira',
      order: 1,
      quests: [
        { type: 'quiz', prompt: '2 + 2?', answer: '4' },
        {
          type: 'fill-in-the-blank',
          prompt: 'A água é _____.',
          answers: ['H2O'],
        },
      ],
      boss: [{ type: 'quiz', prompt: 'Capital do Brasil?', answer: 'Brasília' }],
    },
    {
      name: 'Segunda',
      order: 2,
      quests: [{ type: 'quiz', prompt: '3 + 3?', answer: '6' }],
      boss: [],
    },
  ],
};

test('Campaign JSON v1 cria domínio e valida múltipla escolha', () => {
  const parser = new JsonCampaignParser();
  const campaign = parser.parse(JSON.stringify({
    ...validCampaign,
    trails: [{
      name: 'Única',
      order: 1,
      quests: [{
        type: 'multiple-choice',
        prompt: 'Qual é 2 + 2?',
        options: [
          { text: '3', correct: false },
          { text: '4', correct: true },
        ],
      }],
      boss: [],
    }],
  }));

  const quest = campaign.getTrails()[0].getQuests()[0];
  assert.equal(quest.complete('1').success, true);
});

test('Campaign JSON v1 rejeita estrutura ambígua', () => {
  const parser = new JsonCampaignParser();
  const invalid = structuredClone(validCampaign);
  invalid.trails[0].quests = [{
    type: 'fill-in-the-blank',
    prompt: 'Duas _____ lacunas _____.',
    answers: ['uma'],
  }];
  assert.throws(() => parser.parse(JSON.stringify(invalid)), /número de lacunas/);
});

test('campanhas sobrevivem a recarregar o repositório local', () => {
  const storage = new MemoryStorage();
  const parser = new JsonCampaignParser();
  const firstRepo = new LocalStorageCampaignRepository(storage);
  const campaign = parser.parse(JSON.stringify(validCampaign));
  firstRepo.save(campaign);

  const secondRepo = new LocalStorageCampaignRepository(storage);
  const restored = secondRepo.findById(campaign.id);
  assert.equal(restored.name, 'Demo');
  assert.equal(restored.getTrails().length, 2);
});

test('erro normal entra na revisão; erro de boss não entra', () => {
  const storage = new MemoryStorage();
  const campaigns = new LocalStorageCampaignRepository(storage, 'campaigns');
  const players = new LocalStoragePlayerRepository(storage, 'player');
  const review = new ReviewQueue(new WeightedRandomStrategy(() => 0));
  const campaign = new JsonCampaignParser().parse(JSON.stringify(validCampaign));
  campaigns.save(campaign);
  const answer = new AnswerQuest(campaigns, players, review);
  const trail = campaign.getCurrentUnlockedTrail();

  const first = trail.getQuests()[0];
  assert.equal(answer.execute(campaign.id, first.id, 'errado').correct, false);
  assert.equal(review.size(), 1);

  assert.equal(answer.execute(campaign.id, first.id, '4').correct, true);
  const second = trail.getQuests()[1];
  assert.equal(answer.execute(campaign.id, second.id, ['H2O']).correct, true);

  const boss = trail.getBoss().getCurrentQuest();
  assert.equal(answer.execute(campaign.id, boss.id, 'errado').correct, false);
  assert.equal(review.size(), 1);
});


test('boss reinicia a sequência inteira após erro e não permite farm de XP', () => {
  const boss = new BossContainer([
    new QuizQuest('1?', 'a'),
    new QuizQuest('2?', 'b'),
    new QuizQuest('3?', 'c'),
  ]);

  const firstPass = boss.answerNext('a');
  assert.equal(firstPass.success, true);
  assert.equal(firstPass.xp, 0);
  assert.equal(boss.getCurrentIndex(), 1);

  const failed = boss.answerNext('errado');
  assert.equal(failed.success, false);
  assert.equal(boss.getCurrentIndex(), 0);

  // A primeira questão já foi acertada antes: repeti-la valida a ordem, mas não rende XP.
  const repeatedFirst = boss.answerNext('a');
  assert.equal(repeatedFirst.success, true);
  assert.equal(repeatedFirst.xp, 0);
  assert.equal(boss.getCurrentIndex(), 1);

  assert.equal(boss.answerNext('b').xp, 0);
  const defeated = boss.answerNext('c');
  assert.equal(defeated.success, true);
  assert.equal(defeated.xp, BOSS_XP_REWARD);
  assert.equal(boss.isComplete(), true);
});

test('Campaign JSON v1 rejeita campos desconhecidos para expor typos da IA', () => {
  const parser = new JsonCampaignParser();
  const invalid = structuredClone(validCampaign);
  invalid.trails[0].quests[0].anwser = '4';
  assert.throws(() => parser.parse(JSON.stringify(invalid)), /campo desconhecido "anwser"/);
});
