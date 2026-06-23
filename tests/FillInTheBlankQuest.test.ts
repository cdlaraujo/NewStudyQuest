import { FillInTheBlankQuest } from '../src/domain/quest/FillInTheBlankQuest';

describe('FillInTheBlankQuest', () => {
  it('extracts the gaps inside {} in order', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.gapCount).toBe(2);
    expect(FillInTheBlankQuest.extractGaps('a {one} b {two} c')).toEqual(['one', 'two']);
  });

  it('keeps the original sentence for display', () => {
    const sentence = 'The {mitochondria} is the powerhouse of the {cell}.';
    const quest = new FillInTheBlankQuest(sentence);

    expect(quest.question).toBe(sentence);
    expect(quest.toView()).toEqual({
      id: quest.id,
      type: 'fill-in-the-blank',
      prompt: sentence,
      gaps: 2,
    });
  });

  it('validates an array of answers case-insensitively', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.validate(['nucleus', 'dna'])).toBe(true);
    expect(quest.validate(['  Nucleus ', 'DNA'])).toBe(true);
  });

  it('fails when any gap is wrong or the count mismatches', () => {
    const quest = new FillInTheBlankQuest('The {nucleus} stores {DNA}.');

    expect(quest.validate(['nucleus', 'rna'])).toBe(false);
    expect(quest.validate(['nucleus'])).toBe(false);
    expect(quest.validate('nucleus' as unknown as string[])).toBe(false);
  });

  it('awards 15 XP', () => {
    expect(new FillInTheBlankQuest('a {b}').getXpReward()).toBe(15);
  });
});
