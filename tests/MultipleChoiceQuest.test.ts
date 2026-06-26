import { MultipleChoiceQuest } from '../src/domain/quest/MultipleChoiceQuest';

const OPTIONS = ['Guanine', 'Cytosine', 'Thymine', 'Uracil'];
const CORRECT_INDEX = 2; // Thymine (Timina)

describe('MultipleChoiceQuest', () => {
  let quest: MultipleChoiceQuest;

  beforeEach(() => {
    quest = new MultipleChoiceQuest('Which base pairs with adenine in DNA?', OPTIONS, CORRECT_INDEX);
  });

  it('retorna correto + XP para o índice de opção certo', () => {
    const result = quest.complete('2');
    expect(result.success).toBe(true);
    expect(result.xp).toBe(10);
  });

  it('retorna errado para um índice de opção incorreto', () => {
    expect(quest.complete('0').success).toBe(false);
    expect(quest.complete('1').success).toBe(false);
    expect(quest.complete('3').success).toBe(false);
  });

  it('retorna errado para um tipo de resposta não-string', () => {
    expect(quest.complete(['Thymine']).success).toBe(false);
  });

  it('toView expõe as opções mas não o correctIndex', () => {
    const view = quest.toView();
    expect(view.type).toBe('multiple-choice');
    expect(view.options).toEqual(OPTIONS);
    expect(view).not.toHaveProperty('correctIndex');
  });
});
