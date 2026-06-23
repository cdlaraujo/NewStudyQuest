# EduQuest

A gamified study backend. A student turns raw notes into a markup format using
an **external** chatbot, posts that text to EduQuest, and gets back an RPG-style
**campaign** of trails, quests and bosses. Answering questions earns XP, levels,
streaks and a spaced-repetition review queue.

> The backend **never calls an LLM**. It only parses text the student already
> produced with a chatbot. See [PROMPT.md](PROMPT.md) for the prompt and
> [examples/sample-campaign.txt](examples/sample-campaign.txt) for sample input.

## Architecture

Clean / hexagonal architecture — dependencies point inward, the domain knows
nothing about HTTP, parsing or storage.

```
src/
├── domain/                     # pure business rules, no framework imports
│   ├── quest/                  # Quest (abstract) + QuizQuest, FillInTheBlankQuest, QuestResult
│   ├── boss/                   # BossContainer (composition, not a Quest)
│   ├── trail/                  # Trilha + TrailState machine
│   ├── campaign/               # Campanha (sequential unlocking)
│   ├── player/                 # Player, LevelResult, XpModifier, StreakBonus
│   ├── review/                 # ReviewQueue + WeightStrategy / WeightedRandom / TimeDecay
│   └── shared/                 # normalize()
├── application/                # use cases + ports (interfaces)
│   ├── ports/                  # CampaignRepository, PlayerRepository
│   └── usecases/               # GenerateCampaign, AnswerQuest, GetNextReview, GetPlayer, GetCampaign
├── infrastructure/             # adapters: how the outside world plugs in
│   ├── parser/                 # CampaignParser (text → domain)
│   ├── persistence/            # in-memory repositories
│   └── web/                    # Express server, routes, presenters (+ static UI)
└── main.ts                     # composition root (wires everything together)

public/                         # browser UI (vanilla HTML/CSS/JS, no build step)
├── index.html
├── styles.css
└── app.js
```

### Design patterns on display

| Pattern | Where |
| --- | --- |
| **Template Method / Polymorphism** | `Quest.complete()` calls subclass `validate()` / `getXpReward()`; no type-checks anywhere |
| **Composition over inheritance** | `BossContainer` *contains* quests, it is **not** a `Quest` |
| **State machine** | `Trilha` LOCKED → UNLOCKED → COMPLETED |
| **Strategy** | `WeightStrategy` (`WeightedRandomStrategy`, `TimeDecayWeightStrategy`) |
| **Composed behaviours** | `Player.addXp(base, modifiers)` applies `XpModifier`s in sequence (e.g. `StreakBonus`) |
| **Ports & Adapters** | use cases depend on repository *interfaces*; in-memory adapters implement them |
| **Dependency Injection** | everything is wired in `main.ts`; clocks/RNG are injectable for tests |

Encapsulation is enforced at runtime: `Player`'s `#xp`, `#level`, `#streak` are
true private fields and can only change through `addXp` / `incrementStreak`.

## Getting started

```bash
npm install
npm test          # run the Jest suite (52 tests, all layers)
npm run dev       # start the server with ts-node (http://localhost:3000)
npm run build     # compile to dist/
npm start         # run the compiled server
```

Set `PORT` to change the port (default `3000`).

### Play in the browser

Once the server is running, open **http://localhost:3000/** — a small built-in
UI (served from [public/](public/)) lets you generate a campaign from chatbot
markup (the sample is pre-loaded), answer quizzes and fill-in-the-blanks, fight
bosses, and watch your level/XP/streak rise. It is plain HTML/CSS/JS with no
build step and talks to the same JSON API below.

## API

All data is in memory; there is no auth or database, and a single player,
`player-1`, is shared by everyone. The server also serves the browser UI from
`/` and the static files in [public/](public/).

### `POST /api/campaigns/generate`

Body: `{ "text": "<chatbot-formatted markup>" }`
Returns `201` with the campaign's `id` and full structure (answers are not
included).

```bash
curl -X POST http://localhost:3000/api/campaigns/generate \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"CAMPANHA: Demo\nTRILHA: Intro\nORDEM: 1\nQ: 2 + 2?\nR: 4\"}"
```

### `POST /api/campaigns/:campaignId/quests/:questId/answer`

Body: `{ "answer": "4" }` for a quiz, or `{ "answer": ["a", "b"] }` for
fill-in-the-blank. Returns correctness plus the updated player state:

```json
{ "correct": true, "xpGained": 10, "newLevel": 1, "leveledUp": false, "streak": 1 }
```

### `GET /api/player/review`

Returns the next quest from the review queue (chosen by its dynamic weight), or
`204 No Content` when the queue is empty.

### `GET /api/player`

Returns the current player state for the HUD:

```json
{ "id": "player-1", "level": 1, "xp": 0, "streak": 0, "streakBonusActive": false }
```

### `GET /api/campaigns/:campaignId`

Returns a campaign's current structure (including live trail states), or `404`
if the id is unknown. The UI calls this after a correct answer to reflect a
newly unlocked trail.

## Game rules (summary)

- **QuizQuest** — single string answer, case/whitespace-insensitive, 10 XP.
- **FillInTheBlankQuest** — `{gaps}` answered with an array of strings, 15 XP.
- **Boss** — answer every question in order; one mistake restarts the whole
  boss; clearing it grants 50 XP. Boss failures never go to the review queue.
- **Levels** — XP needed to leave level `L` is `L * 100`; multi-level jumps are
  handled in one award.
- **Streak** — extends on same/next-day activity, resets after a missed day; at
  7 it activates a 24-hour bonus that doubles XP (via the `StreakBonus`
  modifier — the `Player` contains no bonus logic itself).
- **Review queue** — a missed non-boss quest is enqueued with weight 5;
  enqueuing the same quest again stacks its weight.
- **Trails** — finishing a trail (all quests + boss) unlocks the next by order.
```
