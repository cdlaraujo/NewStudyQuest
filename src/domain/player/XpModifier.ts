/**
 * A pluggable rule that transforms an XP amount before it is awarded.
 * Modifiers are composed (applied in sequence) by {@link Player.addXp}, the
 * same way a pricing service composes fees. The Player itself contains no
 * conditional bonus logic — every such rule is an XpModifier injected from
 * outside.
 */
export interface XpModifier {
  apply(xp: number): number;
}
