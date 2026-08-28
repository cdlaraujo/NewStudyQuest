import { Campanha } from '../../domain/campaign/Campanha.js';
import { Trilha } from '../../domain/trail/Trilha.js';
import { BossContainer } from '../../domain/boss/BossContainer.js';
import { QuizQuest } from '../../domain/quest/QuizQuest.js';
import { FillInTheBlankQuest } from '../../domain/quest/FillInTheBlankQuest.js';
import { MultipleChoiceQuest } from '../../domain/quest/MultipleChoiceQuest.js';

/** Converte o JSON v1 produzido pelo chatbot em objetos de domínio. */
export class JsonCampaignParser {
  parse(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('JSON inválido. Verifique vírgulas, aspas e chaves.');
    }

    this.validate(data);
    const trails = data.trails.map((trail) =>
      new Trilha(
        trail.name,
        trail.order,
        trail.quests.map((quest) => this.createQuest(quest)),
        new BossContainer((trail.boss ?? []).map((quest) => this.createQuest(quest))),
      ),
    );
    return new Campanha(data.name, trails);
  }

  validate(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('A campanha deve ser um objeto JSON.');
    }
    this.assertAllowedKeys(data, ['version', 'name', 'trails'], 'Campanha');
    if (data.version !== 1) {
      throw new Error('Campo "version" deve ser 1.');
    }
    this.requireText(data.name, 'Campo "name"');
    if (!Array.isArray(data.trails) || data.trails.length === 0) {
      throw new Error('Campo "trails" deve conter pelo menos uma trilha.');
    }

    const orders = new Set();
    data.trails.forEach((trail, trailIndex) => {
      const where = `Trilha ${trailIndex + 1}`;
      if (!trail || typeof trail !== 'object' || Array.isArray(trail)) {
        throw new Error(`${where} deve ser um objeto.`);
      }
      this.assertAllowedKeys(trail, ['name', 'order', 'quests', 'boss'], where);
      this.requireText(trail.name, `${where}: campo "name"`);
      if (!Number.isInteger(trail.order) || trail.order < 1) {
        throw new Error(`${where}: campo "order" deve ser um inteiro maior que zero.`);
      }
      if (orders.has(trail.order)) {
        throw new Error(`${where}: order ${trail.order} está duplicado.`);
      }
      orders.add(trail.order);
      if (!Array.isArray(trail.quests) || trail.quests.length === 0) {
        throw new Error(`${where}: "quests" deve conter pelo menos uma questão.`);
      }
      trail.quests.forEach((quest, index) => this.validateQuest(quest, `${where}, quest ${index + 1}`));
      if (trail.boss !== undefined && !Array.isArray(trail.boss)) {
        throw new Error(`${where}: "boss" deve ser um array.`);
      }
      (trail.boss ?? []).forEach((quest, index) =>
        this.validateQuest(quest, `${where}, boss ${index + 1}`),
      );
    });
  }

  validateQuest(quest, where) {
    if (!quest || typeof quest !== 'object' || Array.isArray(quest)) {
      throw new Error(`${where}: questão deve ser um objeto.`);
    }
    this.requireText(quest.prompt, `${where}: campo "prompt"`);

    if (quest.type === 'quiz') {
      this.assertAllowedKeys(quest, ['type', 'prompt', 'answer'], where);
      this.requireText(quest.answer, `${where}: campo "answer"`);
      return;
    }

    if (quest.type === 'fill-in-the-blank') {
      this.assertAllowedKeys(quest, ['type', 'prompt', 'answers'], where);
      if (!Array.isArray(quest.answers) || quest.answers.length === 0) {
        throw new Error(`${where}: "answers" deve conter ao menos uma resposta.`);
      }
      quest.answers.forEach((answer, index) =>
        this.requireText(answer, `${where}: answers[${index}]`),
      );
      const gaps = quest.prompt.match(/_____/g)?.length ?? 0;
      if (gaps !== quest.answers.length) {
        throw new Error(`${where}: o número de lacunas _____ deve ser igual ao número de respostas.`);
      }
      return;
    }

    if (quest.type === 'multiple-choice') {
      this.assertAllowedKeys(quest, ['type', 'prompt', 'options'], where);
      if (!Array.isArray(quest.options) || quest.options.length < 2) {
        throw new Error(`${where}: "options" deve conter pelo menos duas alternativas.`);
      }
      let correctCount = 0;
      quest.options.forEach((option, index) => {
        if (!option || typeof option !== 'object' || Array.isArray(option)) {
          throw new Error(`${where}: options[${index}] deve ser um objeto.`);
        }
        this.assertAllowedKeys(option, ['text', 'correct'], `${where}: options[${index}]`);
        this.requireText(option.text, `${where}: options[${index}].text`);
        if (option.correct === true) correctCount += 1;
        else if (option.correct !== false) {
          throw new Error(`${where}: options[${index}].correct deve ser true ou false.`);
        }
      });
      if (correctCount !== 1) {
        throw new Error(`${where}: múltipla escolha deve ter exatamente uma opção correta.`);
      }
      return;
    }

    throw new Error(`${where}: tipo "${quest.type ?? ''}" não suportado.`);
  }

  createQuest(data) {
    switch (data.type) {
      case 'quiz':
        return new QuizQuest(data.prompt, data.answer);
      case 'fill-in-the-blank':
        return new FillInTheBlankQuest(data.prompt, data.answers);
      case 'multiple-choice': {
        const options = data.options.map((option) => option.text);
        const correctIndex = data.options.findIndex((option) => option.correct);
        return new MultipleChoiceQuest(data.prompt, options, correctIndex);
      }
      default:
        throw new Error(`Tipo de quest não suportado: ${data.type}`);
    }
  }

  assertAllowedKeys(value, allowedKeys, where) {
    const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
    if (unknown.length > 0) {
      throw new Error(`${where}: campo desconhecido "${unknown[0]}".`);
    }
  }

  requireText(value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${label} deve ser um texto não vazio.`);
    }
  }
}
