/** Immutable summary returned by {@link Player.addXp}. */
export class LevelResult {
  constructor(
    public readonly xpGained: number,
    public readonly newLevel: number,
    public readonly didLevelUp: boolean,
  ) {}
}
