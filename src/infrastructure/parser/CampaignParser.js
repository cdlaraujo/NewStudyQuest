import { Campanha } from '../../domain/campaign/Campanha.js';
import { Trilha } from '../../domain/trail/Trilha.js';
import { BossContainer } from '../../domain/boss/BossContainer.js';
import { QuizQuest } from '../../domain/quest/QuizQuest.js';
import { FillInTheBlankQuest } from '../../domain/quest/FillInTheBlankQuest.js';
import { MultipleChoiceQuest } from '../../domain/quest/MultipleChoiceQuest.js';

/**
 * Traduz a marcação do chatbot em objetos de domínio. Todas as regras de prefixo
 * vivem aqui na infraestrutura; as classes de domínio nunca sabem que seus dados
 * vieram de texto. O parsing é baseado em linhas e insensível a indentação:
 *
 *   CAMPANHA: <nome>     inicia uma campanha
 *   TRILHA:   <nome>     inicia uma trilha (finaliza a anterior)
 *   ORDEM:    <número>   define a ordem da trilha atual
 *   Q: <texto>                   armazena uma pergunta
 *   R: <resposta>                transforma o Q armazenado + este R em uma QuizQuest
 *   A: {opt, *correto, opt}      transforma o Q armazenado + este A em uma MultipleChoiceQuest
 *   L: <frase {lacuna}>          uma frase para preencher lacunas
 *   BOSS                         Q/L/A subsequentes vão para o boss da trilha
 *
 * Linhas em branco e não reconhecidas são ignoradas.
 */
export class CampaignParser {
  parse(text) {
    let campaignName = 'Untitled Campaign';
    const trails = [];

    let trailName = null;
    let trailOrder = 0;
    let regularQuests = [];
    let bossQuests = [];
    let inBoss = false;
    let pendingQuestion = null;

    const finalizeTrail = () => {
      if (trailName === null) {
        return;
      }
      trails.push(new Trilha(trailName, trailOrder, regularQuests, new BossContainer(bossQuests)));
      trailName = null;
      trailOrder = 0;
      regularQuests = [];
      bossQuests = [];
      inBoss = false;
      pendingQuestion = null;
    };

    const append = (quest) => {
      (inBoss ? bossQuests : regularQuests).push(quest);
    };

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === '') {
        continue; // linhas em branco são ignoradas
      }

      if (line.startsWith('CAMPANHA:')) {
        campaignName = this.valueAfter(line, 'CAMPANHA:');
      } else if (line.startsWith('TRILHA:')) {
        finalizeTrail();
        trailName = this.valueAfter(line, 'TRILHA:');
      } else if (line.startsWith('ORDEM:')) {
        trailOrder = parseInt(this.valueAfter(line, 'ORDEM:'), 10) || 0;
      } else if (line.startsWith('Q:')) {
        pendingQuestion = this.valueAfter(line, 'Q:');
      } else if (line.startsWith('R:')) {
        append(new QuizQuest(pendingQuestion ?? '', this.valueAfter(line, 'R:')));
        pendingQuestion = null;
      } else if (line.startsWith('A:') && pendingQuestion) {
        const raw = this.valueAfter(line, 'A:').trim();
        const inner = raw.replace(/^\{/, '').replace(/\}$/, '');
        const tokens = inner.split(',').map((t) => t.trim());
        const correctIndex = tokens.findIndex((t) => t.startsWith('*'));
        const options = tokens.map((t) => (t.startsWith('*') ? t.slice(1).trim() : t));
        append(new MultipleChoiceQuest(pendingQuestion, options, correctIndex));
        pendingQuestion = null;
      } else if (line.startsWith('L:')) {
        append(new FillInTheBlankQuest(this.valueAfter(line, 'L:')));
      } else if (line.startsWith('BOSS')) {
        inBoss = true;
      }
      // anything else is ignored
    }
    finalizeTrail();

    return new Campanha(campaignName, trails);
  }

  valueAfter(line, prefix) {
    return line.slice(prefix.length).trim();
  }
}
