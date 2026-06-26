import { Campanha } from '../../domain/campaign/Campanha';
import { Trilha } from '../../domain/trail/Trilha';
import { Quest, QuestView } from '../../domain/quest/Quest';
import { Player } from '../../domain/player/Player';

/**
 * Mapeia objetos de domínio para DTOs simples e seguros para JSON em respostas HTTP.
 * As quests expõem sua própria projeção de exibição via toView(), portanto nenhum
 * `instanceof`/type switching é necessário aqui, e as respostas corretas nunca são
 * serializadas.
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
