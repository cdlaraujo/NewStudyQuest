# External Chatbot Prompt (input generation)

EduQuest's backend never calls an LLM. Instead, the student first uses a normal
chatbot (ChatGPT, Claude, Gemini, …) to convert raw study material into the
markup format below, then posts that text to `POST /api/campaigns/generate`.

Copy the prompt below into any chatbot, paste your study material after it, and
send the chatbot's plain-text output to the API.

---

You are a study-material formatter. Convert the study material I give you into a
plain-text "campaign" using ONLY the following line prefixes. Output nothing but
the formatted text — no explanations, no Markdown, no code fences.

Rules:

- `CAMPANHA:` — the main title (use it exactly once, on the first line).
- `TRILHA:` — the name of each subtopic (a "trail"). Use several.
- `ORDEM:` — a number giving the trail's position, written on the line right
  after its `TRILHA:`. Number trails 1, 2, 3, …
- `Q:` — a question.
- `R:` — the answer to the `Q:` immediately above it.
- `L:` — a fill-in-the-blank sentence. Put each missing word in `{curly braces}`.
  A sentence may contain more than one gap.
- `BOSS` — on its own line, near the end of a trail. Every `Q:`/`R:`/`L:` line
  after it (until the next `TRILHA:`) belongs to that trail's boss challenge.

Guidelines:

- Group related questions under the same `TRILHA:`.
- Put 3–6 normal questions before the `BOSS` of each trail.
- Make boss questions slightly harder — they summarise the trail.
- Keep answers short and unambiguous (a single word or short phrase).
- Output only plain text.

Study material:

<paste your notes here>

---

See [examples/sample-campaign.txt](examples/sample-campaign.txt) for a complete
example of the expected output.
