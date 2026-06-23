import { Campanha } from '../../domain/campaign/Campanha';
import { Trilha } from '../../domain/trail/Trilha';
import { BossContainer } from '../../domain/boss/BossContainer';
import { Quest } from '../../domain/quest/Quest';
import { QuizQuest } from '../../domain/quest/QuizQuest';
import { FillInTheBlankQuest } from '../../domain/quest/FillInTheBlankQuest';
import { CampaignTextParser } from '../../application/usecases/GenerateCampaign';

/**
 * Translates the chatbot markup into domain objects. All the prefix rules live
 * here in infrastructure; the domain classes never know their data came from
 * text. Parsing is line-based and indentation-insensitive:
 *
 *   CAMPANHA: <name>     start a campaign
 *   TRILHA:   <name>     start a trail (finalises the previous one)
 *   ORDEM:    <number>   set the current trail's order
 *   Q: <text>            buffer a question
 *   R: <answer>          turn the buffered Q + this R into a QuizQuest
 *   L: <sentence {gap}>  a fill-in-the-blank sentence
 *   BOSS                 subsequent Q/L go into the trail's boss
 *
 * Blank and unrecognised lines are ignored.
 */
export class CampaignParser implements CampaignTextParser {
  parse(text: string): Campanha {
    let campaignName = 'Untitled Campaign';
    const trails: Trilha[] = [];

    let trailName: string | null = null;
    let trailOrder = 0;
    let regularQuests: Quest[] = [];
    let bossQuests: Quest[] = [];
    let inBoss = false;
    let pendingQuestion: string | null = null;

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

    const append = (quest: Quest) => {
      (inBoss ? bossQuests : regularQuests).push(quest);
    };

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line === '') {
        continue; // blank lines are ignored
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

  private valueAfter(line: string, prefix: string): string {
    return line.slice(prefix.length).trim();
  }
}
