# EduQuest

Um backend gamificado para estudos. O estudante transforma suas anotações brutas em um formato de marcação usando um **chatbot externo**, envia esse texto ao EduQuest e recebe de volta uma **campanha** no estilo RPG com trilhas, quests e bosses. Responder perguntas concede XP, níveis, sequências e uma fila de revisão com repetição espaçada.

> O backend **nunca chama um LLM**. Ele apenas analisa o texto que o estudante já produziu com o chatbot. Veja [PROMPT.md](PROMPT.md) para o prompt e [examples/sample-campaign.txt](examples/sample-campaign.txt) para um exemplo de entrada.

## Arquitetura

Arquitetura limpa / hexagonal — as dependências apontam para dentro; o domínio não sabe nada sobre HTTP, parsing ou armazenamento.

```
src/
├── domain/                     # regras de negócio puras, sem imports de framework
│   ├── quest/                  # Quest (abstrato) + QuizQuest, FillInTheBlankQuest, MultipleChoiceQuest, QuestResult
│   ├── boss/                   # BossContainer (composição, não é uma Quest)
│   ├── trail/                  # Trilha + máquina de estados TrailState
│   ├── campaign/               # Campanha (desbloqueio sequencial)
│   ├── player/                 # Player, LevelResult, XpModifier, StreakBonus
│   ├── review/                 # ReviewQueue + WeightStrategy / WeightedRandom / TimeDecay
│   └── shared/                 # normalize()
├── application/                # casos de uso + ports (interfaces)
│   ├── ports/                  # CampaignRepository, PlayerRepository
│   └── usecases/               # GenerateCampaign, AnswerQuest, GetNextReview, GetPlayer, GetCampaign
├── infrastructure/             # adaptadores: como o mundo externo se conecta
│   ├── parser/                 # CampaignParser (texto → domínio)
│   ├── persistence/            # repositórios em memória
│   └── web/                    # servidor Express, rotas, presenters (+ UI estática)
└── main.ts                     # composition root (conecta tudo)

public/                         # UI do navegador (HTML/CSS/JS puro, sem etapa de build)
├── index.html
├── styles.css
└── app.js
```

### Padrões de design em destaque

| Padrão | Onde |
| --- | --- |
| **Template Method / Polimorfismo** | `Quest.complete()` chama `validate()` / `getXpReward()` da subclasse; nenhuma verificação de tipo em nenhum lugar |
| **Composição sobre herança** | `BossContainer` *contém* quests, **não é** uma `Quest` |
| **Máquina de estados** | `Trilha` LOCKED → UNLOCKED → COMPLETED |
| **Strategy** | `WeightStrategy` (`WeightedRandomStrategy`, `TimeDecayWeightStrategy`) |
| **Comportamentos compostos** | `Player.addXp(base, modifiers)` aplica `XpModifier`s em sequência (ex.: `StreakBonus`) |
| **Ports & Adapters** | casos de uso dependem de *interfaces* de repositório; adaptadores em memória as implementam |
| **Injeção de dependência** | tudo é conectado em `main.ts`; relógios/RNG são injetáveis para testes |

O encapsulamento é aplicado em tempo de execução: `#xp`, `#level` e `#streak` do `Player` são campos verdadeiramente privados e só podem mudar por `addXp` / `incrementStreak`.

## Primeiros passos

```bash
npm install
npm test          # executa a suíte Jest (52 testes, todas as camadas)
npm run dev       # inicia o servidor com ts-node (http://localhost:3000)
npm run build     # compila para dist/
npm start         # executa o servidor compilado
```

Defina a variável `PORT` para alterar a porta (padrão `3000`).

### Jogar no navegador

Com o servidor em execução, abra **http://localhost:3000/** — uma pequena UI integrada (servida de [public/](public/)) permite gerar uma campanha a partir da marcação do chatbot (o exemplo vem pré-carregado), responder quizzes e preencher lacunas, enfrentar bosses e acompanhar o aumento do nível/XP/sequência. É HTML/CSS/JS puro sem etapa de build e conversa com a mesma API JSON descrita abaixo.

## API

Todos os dados ficam em memória; não há autenticação nem banco de dados, e um único jogador, `player-1`, é compartilhado por todos. O servidor também serve a UI do navegador em `/` e os arquivos estáticos de [public/](public/).

### `POST /api/campaigns/generate`

Body: `{ "text": "<marcação formatada pelo chatbot>" }`
Retorna `201` com o `id` e a estrutura completa da campanha (respostas não são incluídas).

```bash
curl -X POST http://localhost:3000/api/campaigns/generate \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"CAMPANHA: Demo\nTRILHA: Intro\nORDEM: 1\nQ: 2 + 2?\nR: 4\"}"
```

### `POST /api/campaigns/:campaignId/quests/:questId/answer`

Body: `{ "answer": "4" }` para quiz, ou `{ "answer": ["a", "b"] }` para preencher lacunas. Retorna se acertou mais o estado atualizado do jogador:

```json
{ "correct": true, "xpGained": 10, "newLevel": 1, "leveledUp": false, "streak": 1 }
```

### `GET /api/player/review`

Retorna a próxima quest da fila de revisão (escolhida pelo peso dinâmico), ou `204 No Content` quando a fila está vazia.

### `GET /api/player`

Retorna o estado atual do jogador para o HUD:

```json
{ "id": "player-1", "level": 1, "xp": 0, "streak": 0, "streakBonusActive": false }
```

### `GET /api/campaigns/:campaignId`

Retorna a estrutura atual de uma campanha (incluindo os estados das trilhas em tempo real), ou `404` se o id for desconhecido. A UI chama isso após uma resposta correta para refletir uma trilha recém-desbloqueada.

## Regras do jogo (resumo)

- **QuizQuest** — resposta de string única, insensível a maiúsculas/minúsculas e espaços, 10 XP.
- **FillInTheBlankQuest** — `{lacunas}` respondidas com um array de strings, 15 XP.
- **MultipleChoiceQuest** — o jogador responde com o índice (string) da opção correta; 10 XP.
- **Boss** — responda todas as perguntas em ordem; um erro reinicia o boss inteiro; ao concluí-lo ganha 50 XP. Erros no boss nunca vão para a fila de revisão.
- **Níveis** — o XP necessário para sair do nível `L` é `L * 100`; saltos de múltiplos níveis são tratados em uma única concessão.
- **Sequência (Streak)** — se estende com atividade no mesmo dia ou no dia seguinte, reseta após um dia perdido; ao atingir 7 ativa uma janela bônus de 24 horas que dobra o XP (via modificador `StreakBonus` — o `Player` não contém lógica de bônus).
- **Fila de revisão** — uma quest não-boss errada é enfileirada com peso 5; enfileirar a mesma quest novamente acumula o peso.
- **Trilhas** — concluir uma trilha (todas as quests + boss) desbloqueia a próxima por ordem.
