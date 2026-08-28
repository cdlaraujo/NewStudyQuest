/** Gera ids no navegador e no Node sem depender do módulo `crypto` do Node. */
export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Fallback suficiente para ids locais quando randomUUID não estiver disponível.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = char === 'x' ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}
