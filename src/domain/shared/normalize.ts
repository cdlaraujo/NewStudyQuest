/**
 * Normalização canônica de texto usada ao comparar a resposta do jogador com a
 * resposta esperada: remove espaços ao redor e converte para minúsculas. Mantê-la
 * em um único lugar garante que todo tipo de quest compare respostas da mesma forma.
 */
export function normalize(value: string): string {
  return value.trim().toLowerCase();
}
