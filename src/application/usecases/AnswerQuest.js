import { Player } from '../../domain/player/Player.js';

/** Peso adicionado à fila de revisão na primeira vez que uma quest (não-boss) é errada. */
export const REVIEW_ERROR_WEIGHT = 5;

/**
 * Processa uma única tentativa de resposta. Localiza a quest dentro da trilha
 * desbloqueada atual (quests normais primeiro, depois o boss). Os objetos de quest
 * decidem a correção e a recompensa — este caso de uso nunca inspeciona os tipos
 * de quest.
 *
 * - Correto: concede XP (pelos modificadores do jogador, ex.: bônus de streak),
 *   incrementa o streak e possivelmente desbloqueia a próxima trilha.
 * - Errado, quest normal: enfileira para revisão.
 * - Errado, quest do boss: enfileira para revisão; o boss também reinicia a trilha.
 */
export class AnswerQuest {
  constructor(campaigns, players, getReviewQueue, modifiers = []) {
    this.campaigns = campaigns;
    this.players = players;
    this.getReviewQueue = getReviewQueue;
    this.modifiers = modifiers;
  }

  execute(playerId, campaignId, questId, answer) {
    const campaign = this.campaigns.findById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    let player = this.players.findById(playerId);
    if (!player) {
      player = new Player(playerId);
      this.players.save(player);
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

    // Captura a quest atual do boss antes de answerNext() possivelmente reiniciar o cursor.
    const currentBossQuest = isBossQuest ? boss.getCurrentQuest() : null;

    // A quest/boss decide a correção e quanto XP a tentativa vale.
    const result = regularQuest ? regularQuest.complete(answer) : boss.answerNext(answer);

    let xpGained = 0;
    let newLevel = player.getLevel();
    let leveledUp = false;

    if (result.success) {
      const reward = result.xp;
      const levelResult = player.addXp(reward, this.modifiers);
      xpGained = levelResult.xpGained;
      newLevel = levelResult.newLevel;
      leveledUp = levelResult.didLevelUp;
      player.incrementStreak();
      campaign.completeCurrentTrail(); // desbloqueia a próxima trilha se esta foi concluída
    } else {
      player.resetStreak();
      const failedQuest = regularQuest ?? currentBossQuest;
      if (failedQuest) {
        this.getReviewQueue(playerId).enqueue(failedQuest, REVIEW_ERROR_WEIGHT);
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
      correctAnswer: result.success ? undefined : result.correctAnswer,
    };
  }
}
