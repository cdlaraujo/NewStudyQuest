# EduQuest

EduQuest é um jogo de estudos standalone em HTML/CSS/JavaScript. O estudante usa um chatbot externo para converter seu material em **Campaign JSON v1**, cola o JSON no aplicativo e joga uma campanha com trilhas, quests, bosses, XP, níveis, streak e revisão.

O EduQuest **não chama um LLM e não possui backend**. Campanhas e progresso do jogador ficam no `localStorage` do navegador.

Veja [PROMPT.md](PROMPT.md) para o prompt de geração e [examples/sample-campaign.json](examples/sample-campaign.json) para um exemplo.

## Estrutura

```text
index.html
app.js
styles.css
src/
├── domain/              # regras do jogo
├── application/         # casos de uso
└── infrastructure/
    ├── parser/          # Campaign JSON v1 → domínio
    ├── persistence/     # localStorage
    └── browser/         # DTOs para a UI
```

Não há Express, API REST, banco de dados, autenticação nem dependências de runtime.

## Executar

```bash
npm start
```

Abra `http://localhost:3000`.

O comando inicia apenas um **servidor estático de desenvolvimento** para que os ES modules do navegador funcionem corretamente; não existe API nem processamento no servidor. Em produção, os mesmos arquivos podem ser publicados em qualquer hospedagem estática, como GitHub Pages.

```bash
npm test
```

Os testes usam o test runner nativo do Node.

> Abrir `index.html` diretamente com `file://` ainda não é o modo de distribuição desta versão, porque os módulos ES têm restrições de origem em alguns navegadores. Um build futuro pode empacotar tudo em um único HTML sem mudar o domínio.

## Campaign JSON v1

A raiz possui `version`, `name` e `trails`. Há três tipos de quest:

- `quiz`: `prompt` + `answer`;
- `multiple-choice`: `prompt` + `options`, com exatamente um `correct: true`;
- `fill-in-the-blank`: `prompt` contendo `_____` + array `answers` na mesma ordem.

O importador valida o JSON antes de criar a campanha e mostra erros de estrutura diretamente na UI.

## Persistência local

- campanhas: `localStorage`;
- XP, nível e streak: `localStorage`;
- fila de revisão: apenas durante a sessão atual, como já acontecia com a versão anterior quando o processo era reiniciado.

## Regras principais

- Quiz: 10 XP.
- Preencher lacunas: 15 XP.
- Múltipla escolha: 10 XP.
- Boss: perguntas em sequência; um erro reinicia o boss; vitória concede 50 XP.
- Erros em quests normais entram na revisão; erros de boss não entram.
- Trilhas são desbloqueadas sequencialmente.
- Streak de 7 ativa bônus de XP por 24 horas.

A renderização de matemática usa KaTeX via CDN, portanto fórmulas requerem acesso à internet nesta versão.
