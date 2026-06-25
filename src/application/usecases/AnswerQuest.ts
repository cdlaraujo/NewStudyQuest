import { CampaignRepository } from '../ports/CampaignRepository';
import { PlayerRepository } from '../ports/PlayerRepository';
import { ReviewQueue } from '../../domain/review/ReviewQueue';
import { XpModifier } from '../../domain/player/XpModifier';
import { Answer } from '../../domain/quest/Quest';

/** Weight added to the review queue the first time a (non-boss) quest is missed. */
export const REVIEW_ERROR_WEIGHT = 5;

export interface AnswerResult {
  correct: boolean;
  xpGained: number;
  newLevel: number;
  leveledUp: boolean;
  streak: number;
}

/**
 * Handles a single answer attempt. It locates the quest inside the current
 * unlocked trail (regular quests first, then the boss). The quest objects
 * decide correctness and reward — this use case never inspects quest types.
 *
 * - Correct: award XP (through the player's modifiers, e.g. streak bonus),
 *   bump the streak, and possibly unlock the next trail.
 * - Wrong, regular quest: enqueue it for review.
 * - Wrong, boss quest: nothing is enqueued (boss failures never go to review);
 *   the boss restarts itself.
 */
export class AnswerQuest {
  constructor(
    private readonly campaigns: CampaignRepository,
    private readonly players: PlayerRepository,
    private readonly reviewQueue: ReviewQueue,
    private readonly modifiers: XpModifier[] = [],
    private readonly playerId: string = 'player-1',
  ) {}

  execute(campaignId: string, questId: string, answer: Answer): AnswerResult {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    const player = this.players.findById(this.playerId);
    if (!player) {
      throw new Error(`Player ${this.playerId} not found`);
    }

    const trail = campaign.getCurrentUnlockedTrail();
    if (!trail) {
      throw new Error('No unlocked trail available to answer in');
    }

    const regularQuest = trail.findQuest(questId);
    const boss = trail.getBoss();
    const isBossQuest = !regularQuest && boss.containsQuest(questId);

    if (!regularQuest && !isBossQuest) {
      throw new Error(`Quest ${questId} not found in the current unlocked trail`);
    }

    // The quest/boss decides correctness and how much XP the attempt is worth.
    const result = regularQuest ? regularQuest.complete(answer) : boss.answerNext(answer);

    let xpGained = 0;
    let newLevel = player.getLevel();
    let leveledUp = false;

    if (result.success) {
      // Regular quests award getXpReward(); the boss puts the reward in result.xp.
      const reward = regularQuest ? regularQuest.getXpReward() : result.xp;
      const levelResult = player.addXp(reward, this.modifiers);
      xpGained = levelResult.xpGained;
      newLevel = levelResult.newLevel;
      leveledUp = levelResult.didLevelUp;
      player.incrementStreak();
      campaign.completeCurrentTrail(); // unlocks the next trail if this finished one
    } else {
      player.resetStreak();
      if (regularQuest) {
        // Only non-boss failures are queued for review.
        this.reviewQueue.enqueue(regularQuest, REVIEW_ERROR_WEIGHT);
      }
    }

    this.players.save(player);
    this.campaigns.save(campaign);

    return {
      correct: result.success,
      xpGained,
      newLevel,
      leveledUp,
      streak: player.getStreak(),
    };
  }
}
