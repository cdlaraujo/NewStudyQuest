/** Resumo imutável retornado por {@link Player.addXp}. */
export class LevelResult {
  constructor(xpGained, newLevel, didLevelUp) {
    this.xpGained = xpGained;
    this.newLevel = newLevel;
    this.didLevelUp = didLevelUp;
  }
}
