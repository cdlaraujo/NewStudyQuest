import { Campanha } from '../../domain/campaign/Campanha';
import { Trilha } from '../../domain/trail/Trilha';
import { Quest, QuestView } from '../../domain/quest/Quest';
import { Player } from '../../domain/player/Player';

/**
 * Maps domain objects to plain JSON-safe DTOs for HTTP responses. Quests expose
 * their own display projection via toView(), so no `instanceof`/type switching
 * is needed here, and correct answers are never serialised.
 */

export function questToDto(quest: Quest): QuestView {
  return quest.toView();
}

export function trailToDto(trail: Trilha) {
  return {
    name: trail.name,
    order: trail.order,
    state: trail.getState(),
    quests: trail.getQuests().map(questToDto),
    boss: trail.getBoss().getQuests().map(questToDto),
  };
}

export function campaignToDto(campaign: Campanha) {
  return {
    id: campaign.id,
    name: campaign.name,
    trails: campaign.getTrails().map(trailToDto),
  };
}

export function playerToDto(player: Player) {
  return {
    id: player.id,
    level: player.getLevel(),
    xp: player.getXp(),
    streak: player.getStreak(),
    streakBonusActive: player.isStreakBonusActive(),
  };
}
