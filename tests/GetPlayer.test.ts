import { GetPlayer } from '../src/application/usecases/GetPlayer';
import {
  InMemoryPlayerRepository,
  DEFAULT_PLAYER_ID,
} from '../src/infrastructure/persistence/InMemoryPlayerRepository';
import { Player } from '../src/domain/player/Player';

describe('GetPlayer', () => {
  it('returns the stored player', () => {
    const player = new Player(DEFAULT_PLAYER_ID);
    const useCase = new GetPlayer(new InMemoryPlayerRepository(player), DEFAULT_PLAYER_ID);

    expect(useCase.execute()).toBe(player);
  });

  it('throws when the player is missing', () => {
    const repo = new InMemoryPlayerRepository(new Player(DEFAULT_PLAYER_ID));
    const useCase = new GetPlayer(repo, 'someone-else');

    expect(() => useCase.execute()).toThrow();
  });
});
