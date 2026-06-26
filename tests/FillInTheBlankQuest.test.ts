import { FillInTheBlankQuest } from '../src/domain/quest/FillInTheBlankQuest';

describe('FillInTheBlankQuest', () => {
  it('extrai as lacunas dentro de {} em ordem', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.gapCount).toBe(2);
    expect(FillInTheBlankQuest.extractGaps('a {one} b {two} c')).toEqual(['one', 'two']);
  });

  it('mantém a frase original para exibição', () => {
    const sentence = 'The {mitochondria} is the powerhouse of the {cell}.';
    const quest = new FillInTheBlankQuest(sentence);

    expect(quest.question).toBe(sentence);
    expect(quest.toView()).toEqual({
      id: quest.id,
      type: 'fill-in-the-blank',
      prompt: 'The _____ is the powerhouse of the _____.',
      gaps: 2,
    });
  });

  it('valida um array de respostas sem diferenciação de maiúsculas/minúsculas', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.validate(['nucleus', 'dna'])).toBe(true);
    expect(quest.validate(['  Nucleus ', 'DNA'])).toBe(true);
  });

  it('falha quando qualquer lacuna está errada ou a quantidade não corresponde', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.validate(['nucleus', 'rna'])).toBe(false);
    expect(quest.validate(['nucleus'])).toBe(false);
    expect(quest.validate('nucleus' as unknown as string[])).toBe(false);
  });

  it('concede 15 XP', () => {
    expect(new FillInTheBlankQuest('a {b}').getXpReward()).toBe(15);
  });
});
