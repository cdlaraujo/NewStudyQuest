import { Player } from '../src/domain/player/Player';
import { XpModifier } from '../src/domain/player/XpModifier';

describe('Player', () => {
  describe('encapsulamento', () => {
    it('mantém xp e level privados — não podem ser definidos externamente', () => {
      const player = new Player('p1');

      // campos privados (#) não são visíveis como propriedades públicas
      expect((player as any).xp).toBeUndefined();
      expect((player as any).level).toBeUndefined();
      expect((player as any).setXp).toBeUndefined();

      // atribuir um campo público de mesmo nome não corrompe o estado real
      (player as any).xp = 9999;
      (player as any).level = 50;
      expect(player.getXp()).toBe(0);
      expect(player.getLevel()).toBe(1);
    });
  });

  describe('addXp', () => {
    it('acumula XP sem subir de nível abaixo do limiar', () => {
      const player = new Player('p1');

      const result = player.addXp(50);

      expect(player.getXp()).toBe(50);
      expect(result).toMatchObject({ xpGained: 50, newLevel: 1, didLevelUp: false });
    });

    it('aplica modificadores em sequência antes de adicionar', () => {
      const player = new Player('p1');
      const double: XpModifier = { apply: (xp) => xp * 2 };

      const result = player.addXp(10, [double]);

      expect(result.xpGained).toBe(20);
      expect(player.getXp()).toBe(20);
    });

    it('sobe de nível quando XP atinge nível * 100', () => {
      const player = new Player('p1');

      player.addXp(50);
      const result = player.addXp(50); // total 100 -> nível 2 com 0 restante

      expect(result).toMatchObject({ didLevelUp: true, newLevel: 2 });
      expect(player.getLevel()).toBe(2);
      expect(player.getXp()).toBe(0);
    });

    it('lida com saltos de múltiplos níveis em uma única concessão', () => {
      const player = new Player('p1');

      // 350 - 100 -> N2 (250 restante); - 200 -> N3 (50 restante); 50 < 300 para
      const result = player.addXp(350);

      expect(result).toMatchObject({ didLevelUp: true, newLevel: 3 });
      expect(player.getLevel()).toBe(3);
      expect(player.getXp()).toBe(50);
    });
  });

  describe('streak', () => {
    it('ativa o bônus quando o streak atinge 7', () => {
      const now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();

      expect(player.getStreak()).toBe(7);
      expect(player.isStreakBonusActive()).toBe(true);
    });

    it('reinicia o streak quando um dia é perdido', () => {
      let now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      player.incrementStreak();
      player.incrementStreak(); // mesmo dia -> streak 2
      expect(player.getStreak()).toBe(2);

      now = new Date('2026-06-17T08:00:00'); // pulou o dia 16
      player.incrementStreak();
      expect(player.getStreak()).toBe(1);
    });

    it('deixa o bônus expirar após a janela de 24h', () => {
      let now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();
      expect(player.isStreakBonusActive()).toBe(true);

      now = new Date('2026-06-17T08:00:00'); // bem além da expiração
      expect(player.isStreakBonusActive()).toBe(false);
    });

    it('resetStreak limpa o streak e o bônus', () => {
      const now = new Date('2026-06-15T08:00:00');
      const player = new Player('p1', () => now);

      for (let i = 0; i < 7; i++) player.incrementStreak();
      player.resetStreak();

      expect(player.getStreak()).toBe(0);
      expect(player.isStreakBonusActive()).toBe(false);
    });
  });
});
