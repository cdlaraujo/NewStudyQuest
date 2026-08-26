/**
 * Mapeia objetos de domínio para DTOs simples e seguros para JSON em respostas HTTP.
 * As quests expõem sua própria projeção de exibição via toView(), portanto nenhum
 * `instanceof`/type switching é necessário aqui, e as respostas corretas nunca são
 * serializadas.
 */

export function questToDto(quest) {
  return quest.toView();
}

export function trailToDto(trail) {
  return {
    name: trail.name,
    order: trail.order,
    state: trail.getState(),
    quests: trail.getQuests().map(questToDto),
    boss: trail.getBoss().getQuests().map(questToDto),
  };
}

export function campaignToDto(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    trails: campaign.getTrails().map(trailToDto),
  };
}

/** Projeção leve para a antesala — sem as trilhas/quests aninhadas do detalhe completo. */
export function campaignSummaryToDto(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    trailCount: campaign.getTrails().length,
  };
}

export function playerToDto(player) {
  return {
    id: player.id,
    level: player.getLevel(),
    xp: player.getXp(),
    streak: player.getStreak(),
    streakBonusActive: player.isStreakBonusActive(),
  };
}
