import { Player } from '../src/domain/player/Player';
import { XpModifier } from '../src/domain/player/XpModifier';

describe('Player', () => {
  describe('encapsulation', () => {
    it('keeps xp and level private — they cannot be set from outside', () => {
      const player = new Player('p1');

      // private (#) fields are not visible as public properties
      expect((player as any).xp).toBeUndefined();
      expect((player as any).level).toBeUndefined();
      expect((player as any).setXp).toBeUndefined();

      // assigning a public field of the same name cannot corrupt the real state
      (player as any).xp = 9999;
      (player as any).level = 50;
      expect(player.getXp()).toBe(0);
      expect(player.getLevel()).toBe(1);
    });
  });

  describe('addXp', () => {
    it('accumulates XP without levelling below the threshold', () => {
      const player = new Player('p1');

      const result = player.addXp(50);

      expect(player.getXp()).toBe(50);
      expect(result).toMatchObject({ xpGained: 50, newLevel: 1, didLevelUp: false });
    });

    it('applies modifiers in sequence before adding', () => {
      const player = new Player('p1');
      const double: XpModifier = { apply: (xp) => xp * 2 };

      const result = player.addXp(10, [double]);

      expect(result.xpGained).toBe(20);
      expect(player.getXp()).toBe(20);
    });

    it('levels up when XP reaches level * 100', () => {
      const player = new Player('p1');

      player.addXp(50);
      const result = player.addXp(50); // total 100 -> level 2 with 0 left over

      expect(result).toMatchObject({ didLevelUp: true, newLevel: 2 });
      expect(player.getLevel()).toBe(2);
      expect(player.getXp()).toBe(0);
    });

    it('handles multi-level jumps in a single award', () => {
      const player = new Player('p1');

      // 350 - 100 -> L2 (250 left); - 200 -> L3 (50 left); 50 < 300 stop
      const result = player.addXp(350);

      expect(result).toMatchObject({ didLevelUp: true, newLevel: 3 });
      expect(player.getLevel()).toBe(3);
      expect(player.getXp()).toBe(50);
    });
  });

  describe('streak', () => {
    it('activates the bonus when the streak reaches 7', () => {
      const now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();

      expect(player.getStreak()).toBe(7);
      expect(player.isStreakBonusActive()).toBe(true);
    });

    it('resets the streak when a day is missed', () => {
      let now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      player.incrementStreak();
      player.incrementStreak(); // same day -> streak 2
      expect(player.getStreak()).toBe(2);

      now = new Date('2026-06-17T08:00:00'); // skipped the 16th
      player.incrementStreak();
      expect(player.getStreak()).toBe(1);
    });

    it('lets the bonus expire after its 24h window', () => {
      let now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();
      expect(player.isStreakBonusActive()).toBe(true);

      now = new Date('2026-06-17T08:00:00'); // well past expiry
      expect(player.isStreakBonusActive()).toBe(false);
    });

    it('resetStreak clears the streak and the bonus', () => {
      const now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();
      player.resetStreak();

      expect(player.getStreak()).toBe(0);
      expect(player.isStreakBonusActive()).toBe(false);
    });
  });
});
