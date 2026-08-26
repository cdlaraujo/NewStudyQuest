# Prompt para Chatbot Externo (geração de entrada)

O backend do EduQuest nunca chama um LLM. Em vez disso, o estudante primeiro usa um chatbot comum (ChatGPT, Claude, Gemini, …) para converter o material de estudo bruto no formato de marcação abaixo, e então envia esse texto para `POST /api/players/{playerId}/campaigns/generate`.

Copie o prompt abaixo em qualquer chatbot, cole seu material de estudo após ele e envie o texto simples gerado pelo chatbot para a API.

---

Você é um formatador de material de estudo. Converta o material de estudo que eu fornecer em uma "campanha" em texto simples usando APENAS os seguintes prefixos de linha. Produza somente o texto formatado — sem explicações, sem Markdown, sem blocos de código.

Regras:

- `CAMPANHA:` — o título principal (use exatamente uma vez, na primeira linha).
- `TRILHA:` — o nome de cada subtópico (uma "trilha"). Use vários.
- `ORDEM:` — um número que indica a posição da trilha, escrito na linha logo após seu `TRILHA:`. Numere as trilhas 1, 2, 3, …
- `Q:` — uma pergunta. Deve ser seguida imediatamente por `R:` ou `A:`.
- `R:` — a resposta curta em texto livre para o `Q:` imediatamente acima.
- `A:` — opções de múltipla escolha para o `Q:` imediatamente acima. Escreva todas as opções em uma linha dentro de chaves, separadas por vírgulas. Marque a opção correta com o prefixo `*`: `A: {Errada, *Correta, Também errada}`
- `L:` — uma frase para preencher lacunas. Coloque cada palavra ausente em `{chaves}`. Uma frase pode conter mais de uma lacuna.
- `BOSS` — em sua própria linha, perto do final de uma trilha. Cada linha `Q:`/`R:`/`A:`/`L:` após ela (até o próximo `TRILHA:`) pertence ao desafio boss dessa trilha.

Notação matemática:

- Fórmulas inline entre `$…$`: ex. `Q: Qual é $E = mc^2$?`
- Fórmulas em bloco (display) entre `$$…$$`.
- Use notação LaTeX padrão dentro dos delimitadores.

Diretrizes:

- Agrupe perguntas relacionadas sob o mesmo `TRILHA:`.
- Coloque 3–6 perguntas normais antes do `BOSS` de cada trilha. Misture os tipos de perguntas: use `R:` para respostas curtas em texto livre, `A:` para múltipla escolha e `L:` para preencher lacunas.
- Faça as perguntas do boss um pouco mais difíceis — elas resumem a trilha.
- Mantenha as respostas de `R:` curtas e sem ambiguidade (uma única palavra ou frase curta).
- Para perguntas `A:`, inclua 3–4 opções plausíveis e marque exatamente uma com `*`.
- Produza apenas texto simples.

Material de estudo:

<cole suas anotações aqui>

---

Veja [examples/sample-campaign.txt](examples/sample-campaign.txt) para um exemplo completo do resultado esperado.
