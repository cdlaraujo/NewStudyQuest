import { Player } from '../../domain/player/Player.js';

export const REVIEW_ERROR_WEIGHT = 5;

/** Processa uma tentativa no único perfil local. */
export class AnswerQuest {
  constructor(campaigns, players, reviewQueue, modifiers = []) {
    this.campaigns = campaigns;
    this.players = players;
    this.reviewQueue = reviewQueue;
    this.modifiers = modifiers;
  }

  execute(campaignId, questId, answer) {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    let player = this.players.get();
    if (!player) player = new Player('local-player');

    const trail = campaign.getCurrentUnlockedTrail();
    if (!trail) throw new Error('No unlocked trail available to answer in');

    const regularQuest = trail.findQuest(questId);
    const boss = trail.getBoss();
    const isBossQuest = !regularQuest && boss.containsQuest(questId);
    if (!regularQuest && !isBossQuest) {
      throw new Error(`Quest ${questId} not found in the current unlocked trail`);
    }

    const result = regularQuest ? regularQuest.complete(answer) : boss.answerNext(answer);
    let xpGained = 0;
    let newLevel = player.getLevel();
    let leveledUp = false;

    if (result.success) {
      const levelResult = player.addXp(result.xp, this.modifiers);
      xpGained = levelResult.xpGained;
      newLevel = levelResult.newLevel;
      leveledUp = levelResult.didLevelUp;
      player.incrementStreak();
      campaign.completeCurrentTrail();
    } else {
      player.resetStreak();
      // Boss reinicia a trilha, mas não entra na revisão.
      if (regularQuest) this.reviewQueue.enqueue(regularQuest, REVIEW_ERROR_WEIGHT);
    }

    this.players.save(player);
    this.campaigns.save(campaign);

    return {
      correct: result.success,
      xpGained,
      newLevel,
      leveledUp,
      streak: player.getStreak(),
      correctAnswer: result.success ? undefined : result.correctAnswer,
    };
  }
}
