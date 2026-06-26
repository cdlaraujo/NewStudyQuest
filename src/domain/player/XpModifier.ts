/**
 * Regra plugável que transforma um valor de XP antes de ser concedido.
 * Os modificadores são compostos (aplicados em sequência) por {@link Player.addXp},
 * da mesma forma que um serviço de preços compõe taxas. O Player em si não contém
 * lógica condicional de bônus — cada uma dessas regras é um XpModifier injetado
 * externamente.
 */
export interface XpModifier {
  apply(xp: number): number;
}
