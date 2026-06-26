/** Resumo imutável retornado por {@link Player.addXp}. */
export class LevelResult {
  constructor(
    public readonly xpGained: number,
    public readonly newLevel: number,
    public readonly didLevelUp: boolean,
  ) {}
}
