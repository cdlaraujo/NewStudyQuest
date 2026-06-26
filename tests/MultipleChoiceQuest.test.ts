import { MultipleChoiceQuest } from '../src/domain/quest/MultipleChoiceQuest';

const OPTIONS = ['Guanine', 'Cytosine', 'Thymine', 'Uracil'];
const CORRECT_INDEX = 2; // Thymine

describe('MultipleChoiceQuest', () => {
  let quest: MultipleChoiceQuest;

  beforeEach(() => {
    quest = new MultipleChoiceQuest('Which base pairs with adenine in DNA?', OPTIONS, CORRECT_INDEX);
  });

  it('returns correct + XP for the right option index', () => {
    const result = quest.complete('2');
    expect(result.success).toBe(true);
    expect(result.xp).toBe(10);
  });

  it('returns wrong for an incorrect option index', () => {
    expect(quest.complete('0').success).toBe(false);
    expect(quest.complete('1').success).toBe(false);
    expect(quest.complete('3').success).toBe(false);
  });

  it('returns wrong for a non-string answer type', () => {
    expect(quest.complete(['Thymine']).success).toBe(false);
  });

  it('toView exposes options but not correctIndex', () => {
    const view = quest.toView();
    expect(view.type).toBe('multiple-choice');
    expect(view.options).toEqual(OPTIONS);
    expect(view).not.toHaveProperty('correctIndex');
  });
});
