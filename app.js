import { JsonCampaignParser } from './src/infrastructure/parser/JsonCampaignParser.js';
import { LocalStorageCampaignRepository } from './src/infrastructure/persistence/LocalStorageCampaignRepository.js';
import { LocalStoragePlayerRepository } from './src/infrastructure/persistence/LocalStoragePlayerRepository.js';
import { StreakBonus } from './src/domain/player/StreakBonus.js';
import { ReviewQueue } from './src/domain/review/ReviewQueue.js';
import { WeightedRandomStrategy } from './src/domain/review/WeightedRandomStrategy.js';
import { GenerateCampaign } from './src/application/usecases/GenerateCampaign.js';
import { AnswerQuest } from './src/application/usecases/AnswerQuest.js';
import { GetNextReview } from './src/application/usecases/GetNextReview.js';
import { GetPlayer } from './src/application/usecases/GetPlayer.js';
import { GetCampaign } from './src/application/usecases/GetCampaign.js';
import { ListCampaigns } from './src/application/usecases/ListCampaigns.js';
import { DeleteCampaign } from './src/application/usecases/DeleteCampaign.js';
import {
  campaignToDto,
  campaignSummaryToDto,
  questToDto,
  playerToDto,
} from './src/infrastructure/browser/presenters.js';

// ---- Campanha de exemplo (Campaign JSON v1) ----
const SAMPLE = `{
  "version": 1,
  "name": "Noções Básicas de Biologia Celular",
  "trails": [
    {
      "name": "A Célula",
      "order": 1,
      "quests": [
        {
          "type": "quiz",
          "prompt": "Qual organela armazena o material genético da célula?",
          "answer": "Núcleo"
        },
        {
          "type": "multiple-choice",
          "prompt": "Qual organela é a central de energia da célula?",
          "options": [
            { "text": "Parede celular", "correct": false },
            { "text": "Mitocôndria", "correct": true },
            { "text": "Ribossomo", "correct": false },
            { "text": "Núcleo", "correct": false }
          ]
        },
        {
          "type": "fill-in-the-blank",
          "prompt": "O _____ armazena o DNA, enquanto os ribossomos produzem _____.",
          "answers": ["núcleo", "proteínas"]
        }
      ],
      "boss": [
        {
          "type": "quiz",
          "prompt": "O que envolve e protege toda a célula?",
          "answer": "Membrana celular"
        },
        {
          "type": "fill-in-the-blank",
          "prompt": "As células vegetais possuem, adicionalmente, uma _____ rígida.",
          "answers": ["parede celular"]
        }
      ]
    },
    {
      "name": "DNA e Genética",
      "order": 2,
      "quests": [
        {
          "type": "quiz",
          "prompt": "Quantas fitas possui a dupla hélice de DNA?",
          "answer": "2"
        },
        {
          "type": "multiple-choice",
          "prompt": "Qual molécula transporta a informação genética do DNA para os ribossomos?",
          "options": [
            { "text": "tRNA", "correct": false },
            { "text": "rRNA", "correct": false },
            { "text": "mRNA", "correct": true },
            { "text": "snRNA", "correct": false }
          ]
        },
        {
          "type": "fill-in-the-blank",
          "prompt": "O DNA é composto por unidades repetitivas chamadas _____.",
          "answers": ["nucleotídeos"]
        }
      ],
      "boss": [
        {
          "type": "multiple-choice",
          "prompt": "Qual base se pareia com a adenina no DNA?",
          "options": [
            { "text": "Guanina", "correct": false },
            { "text": "Citosina", "correct": false },
            { "text": "Timina", "correct": true },
            { "text": "Uracila", "correct": false }
          ]
        }
      ]
    }
  ]
}`;

// ---- Composition root local: domínio + localStorage, sem API/servidor ----
const campaignRepo = new LocalStorageCampaignRepository();
const playerRepo = new LocalStoragePlayerRepository();
const reviewQueue = new ReviewQueue(new WeightedRandomStrategy());
const parser = new JsonCampaignParser();

const useCases = {
  generateCampaign: new GenerateCampaign(parser, campaignRepo),
  answerQuest: new AnswerQuest(campaignRepo, playerRepo, reviewQueue, [new StreakBonus()]),
  getNextReview: new GetNextReview(reviewQueue),
  getPlayer: new GetPlayer(playerRepo),
  getCampaign: new GetCampaign(campaignRepo),
  listCampaigns: new ListCampaigns(campaignRepo),
  deleteCampaign: new DeleteCampaign(campaignRepo),
};

// ---- Estado da aplicação ----
const state = {
  campaignId: null,
  campaign: null,
  currentTrailOrder: null,
  currentQuestIndex: 0,
  bossIndex: 0,
  completed: new Set(),
};

function completedQuestIds(campaign) {
  return new Set(
    (campaign?.trails ?? []).flatMap((trail) =>
      (trail.quests ?? []).filter((quest) => quest.completed).map((quest) => quest.id),
    ),
  );
}

// ---- Utilitários DOM ----
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );

let toastTimer;
function toast(msg, levelup = false) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.toggle('levelup', levelup);
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => (el.hidden = true), 250);
  }, 2200);
}

// Mantém a antiga forma { status, data } para não reescrever a UI inteira.
async function generateCampaign(text) {
  try {
    return { status: 201, data: campaignToDto(useCases.generateCampaign.execute(text)) };
  } catch (error) {
    return { status: 400, data: { error: error.message } };
  }
}

async function fetchCampaign(id) {
  try {
    return { status: 200, data: campaignToDto(useCases.getCampaign.execute(id)) };
  } catch (error) {
    return { status: 404, data: { error: error.message } };
  }
}

async function fetchPlayer() {
  return { status: 200, data: playerToDto(useCases.getPlayer.execute()) };
}

async function fetchReview() {
  const quest = useCases.getNextReview.execute();
  return quest ? { status: 200, data: questToDto(quest) } : { status: 204, data: null };
}

async function sendAnswer(campaignId, questId, answer) {
  try {
    return { status: 200, data: useCases.answerQuest.execute(campaignId, questId, answer) };
  } catch (error) {
    return { status: 404, data: { error: error.message } };
  }
}

async function listCampaigns() {
  return {
    status: 200,
    data: useCases.listCampaigns.execute().map(campaignSummaryToDto),
  };
}

async function deleteCampaign(id) {
  try {
    useCases.deleteCampaign.execute(id);
    return { status: 204, data: null };
  } catch (error) {
    return { status: 404, data: { error: error.message } };
  }
}

// ---- HUD (painel de status) ----
async function refreshHud() {
  const { status, data } = await fetchPlayer();
  if (status !== 200 || !data) return;
  $('hud').hidden = false;
  $('hud-level').textContent = data.level;
  $('hud-xp').textContent = data.xp;
  $('hud-streak').textContent = data.streak;
  const pct = Math.min(100, Math.round((data.xp / (data.level * 100)) * 100));
  $('hud-xpbar').style.width = `${pct}%`;
  $('hud-bonus').hidden = !data.streakBonusActive;
}

// ---- Antesala (campanhas já geradas por este jogador) ----
async function refreshLobby() {
  const { status, data } = await listCampaigns();
  const lobby = $('lobby');
  const list = $('lobby-list');
  if (status !== 200 || !data || data.length === 0) {
    lobby.hidden = true;
    list.innerHTML = '';
    return;
  }
  lobby.hidden = false;
  list.innerHTML = '';
  data.forEach((c) => {
    const li = document.createElement('li');
    li.className = 'lobby-item';
    li.innerHTML = `
      <span class="lobby-name">${esc(c.name)}</span>
      <span class="muted">${c.trailCount} trilha(s)</span>
      <button class="btn ghost lobby-play">Continuar</button>
      <button class="btn ghost lobby-delete">Excluir</button>`;
    li.querySelector('.lobby-play').addEventListener('click', () => resumeCampaign(c.id));
    li.querySelector('.lobby-delete').addEventListener('click', async () => {
      await deleteCampaign(c.id);
      await refreshLobby();
    });
    list.appendChild(li);
  });
}

async function resumeCampaign(campaignId) {
  const { status, data } = await fetchCampaign(campaignId);
  if (status !== 200 || !data) return;
  state.campaignId = data.id;
  state.campaign = data;
  state.completed = completedQuestIds(data);
  const unlocked = data.trails.find((trail) => trail.state === 'UNLOCKED');
  state.bossIndex = unlocked?.bossCurrent ?? 0;
  $('create-panel').hidden = true;
  $('play-panel').hidden = false;
  await refreshHud();
  render();
}

// ---- Fluxo de geração ----
function showCreateError(message) {
  const errEl = $('create-error');
  errEl.textContent = message;
  errEl.hidden = false;
  toast('Não foi possível importar a campanha.');
  errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('source').focus();
}

async function onGenerate() {
  const text = $('source').value.trim();
  const errEl = $('create-error');
  errEl.hidden = true;
  if (!text) {
    showCreateError('Cole o JSON da campanha primeiro (ou carregue o exemplo).');
    return;
  }
  const { status, data } = await generateCampaign(text);
  if (status !== 201 || !data) {
    showCreateError((data && data.error) || 'Não foi possível gerar a campanha.');
    return;
  }
  state.campaignId = data.id;
  state.campaign = data;
  state.completed = completedQuestIds(data);
  const unlocked = data.trails.find((trail) => trail.state === 'UNLOCKED');
  state.bossIndex = unlocked?.bossCurrent ?? 0;
  $('create-panel').hidden = true;
  $('play-panel').hidden = false;
  await refreshHud();
  render();
  await refreshLobby();
}

// ---- Auxiliares ----
function formatAnswer(a) {
  return Array.isArray(a) ? a.join(', ') : (a ?? '');
}

// ---- Renderização matemática ----
function renderMath(el) {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }
}

// ---- Renderização ----
function currentTrail() {
  if (!state.campaign) return null;
  return state.campaign.trails.find((t) => t.state === 'UNLOCKED') || null;
}

function render() {
  $('campaign-name').textContent = state.campaign.name;
  renderTrailsNav();

  const trail = currentTrail();
  if (!trail) {
    // nenhuma trilha desbloqueada restante → campanha concluída
    $('trail-title').textContent = '';
    $('quests').innerHTML = '';
    $('boss').hidden = true;
    $('trail-done').hidden = false;
    $('trail-done').innerHTML = `<h2>🎉 Campanha concluída!</h2>
      <p class="muted">Todas as trilhas concluídas. Use <strong>Revisão</strong> para rever questões difíceis, ou inicie uma nova campanha.</p>`;
    return;
  }

  state.currentTrailOrder = trail.order;
  state.currentQuestIndex = 0;
  state.bossIndex = trail.bossCurrent ?? 0;
  $('trail-done').hidden = true;
  $('trail-title').textContent = `Trilha ${trail.order}: ${trail.name}`;

  renderCurrentQuest(trail);
}

function renderTrailsNav() {
  const nav = $('trails-nav');
  nav.innerHTML = '';
  state.campaign.trails.forEach((t) => {
    const chip = document.createElement('span');
    chip.className = `chip ${t.state.toLowerCase()}`;
    chip.textContent = `${t.order}. ${t.name}`;
    nav.appendChild(chip);
  });
}

function questCard(q, trail, opts = {}) {
  const card = document.createElement('div');
  card.className = 'card';
  const done = state.completed.has(q.id);
  if (done) card.classList.add('done');

  const isFill = q.type === 'fill-in-the-blank';
  const isMC = q.type === 'multiple-choice';

  if (isMC) {
    card.innerHTML = `
      <div class="qtype">Múltipla escolha</div>
      <div class="prompt">${esc(q.prompt)}</div>
      <div class="mc-options">
        ${(q.options ?? []).map((opt, i) =>
          `<label class="mc-label"><input type="radio" name="mc-${q.id}" value="${i}" ${done ? 'disabled' : ''}/>${esc(opt)}</label>`
        ).join('')}
      </div>
      <div class="answer-row" style="margin-top:10px">
        <button class="btn primary">${done ? 'Respondida ✓' : 'Enviar'}</button>
      </div>
      <div class="feedback ${done ? 'ok' : ''}">${done ? '✓ Resolvida' : ''}</div>`;
  } else {
    const isFillInputs = isFill
      ? Array.from({ length: q.gaps || 1 }, (_, i) => `<input data-gap="${i}" placeholder="Lacuna ${i + 1}" />`).join('')
      : `<input placeholder="Sua resposta" />`;
    const qtypeLabel = isFill ? 'Preencher lacunas' : 'Quiz';
    card.innerHTML = `
      <div class="qtype">${qtypeLabel}</div>
      <div class="prompt">${esc(q.prompt)}</div>
      <div class="answer-row">
        ${isFillInputs}
        <button class="btn primary">${done ? 'Respondida ✓' : 'Enviar'}</button>
      </div>
      <div class="feedback ${done ? 'ok' : ''}">${done ? '✓ Resolvida' : ''}</div>`;
  }

  const button = card.querySelector('button');
  const fields = Array.from(card.querySelectorAll('input'));
  if (done) {
    fields.forEach((f) => (f.disabled = true));
    button.disabled = true;
  }

  const submit = () => handleAnswer({ q, isFill, isMC, fields, card, button, trail, boss: opts.boss });
  button.addEventListener('click', submit);
  if (!isMC) {
    fields.forEach((f) =>
      f.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
      }),
    );
  }
  return card;
}

function renderCurrentQuest(trail) {
  const questsEl = $('quests');
  questsEl.innerHTML = '';
  $('boss').hidden = true;

  // Encontra a primeira quest ainda não respondida corretamente
  const nextIdx = trail.quests.findIndex((q) => !state.completed.has(q.id));
  if (nextIdx === -1) {
    renderBoss(trail);
    return;
  }

  const progress = document.createElement('p');
  progress.className = 'quest-progress muted';
  progress.textContent = `Questão ${nextIdx + 1} de ${trail.quests.length}`;
  questsEl.appendChild(progress);
  questsEl.appendChild(questCard(trail.quests[nextIdx], trail));
  renderMath(questsEl);
}

function renderBoss(trail) {
  const bossEl = $('boss');
  if (!trail.boss || trail.boss.length === 0) {
    bossEl.hidden = true;
    maybeAdvanceTrail(); // trail may already be complete
    return;
  }
  bossEl.hidden = false;
  const idx = state.bossIndex;
  const q = trail.boss[idx];
  bossEl.innerHTML = `
    <h3>🐉 Desafio Boss</h3>
    <div class="boss-progress">Questão ${idx + 1} de ${trail.boss.length} — um erro reinicia o boss!</div>
    <div id="boss-card"></div>`;
  const card = questCard(q, trail, { boss: true });
  bossEl.querySelector('#boss-card').appendChild(card);
  renderMath(bossEl);
}

// ---- Resposta ----
async function handleAnswer({ q, isFill, isMC, fields, card, button, trail, boss }) {
  const feedback = card.querySelector('.feedback');
  const answer = isMC
    ? (card.querySelector(`input[name="mc-${q.id}"]:checked`)?.value ?? '')
    : isFill
      ? fields.map((f) => f.value)
      : fields[0].value;
  const isEmpty = isMC
    ? answer === ''
    : isFill
      ? answer.some((a) => a.trim() === '')
      : answer.trim() === '';
  if (isEmpty) {
    feedback.className = 'feedback bad';
    feedback.textContent = isMC ? 'Selecione uma opção primeiro.' : 'Preencha todos os campos primeiro.';
    return;
  }

  button.disabled = true;
  const { data } = await sendAnswer(state.campaignId, q.id, answer);
  await refreshHud();

  if (!data) {
    feedback.className = 'feedback bad';
    feedback.textContent = 'Algo deu errado.';
    button.disabled = false;
    return;
  }

  if (boss) return handleBossResult(data, trail, feedback);

  if (data.correct) {
    state.completed.add(q.id);
    card.classList.add('done');
    fields.forEach((f) => (f.disabled = true));
    button.textContent = 'Respondida ✓';
    feedback.className = 'feedback ok';
    feedback.textContent = `✓ Correto!  +${data.xpGained} XP`;
    if (data.leveledUp) toast(`⬆️ Subiu de nível! Você agora é nível ${data.newLevel}`, true);
    else toast(`✓ +${data.xpGained} XP`);
    setTimeout(() => {
      const trail = state.campaign.trails.find((t) => t.order === state.currentTrailOrder);
      renderCurrentQuest(trail);
    }, 800);
  } else {
    feedback.className = 'feedback bad';
    feedback.textContent = `✗ Não foi — resposta: ${formatAnswer(data.correctAnswer)}. Adicionada à revisão.`;
    setTimeout(() => {
      const trail = state.campaign.trails.find((t) => t.order === state.currentTrailOrder);
      renderCurrentQuest(trail);
    }, 1200);
  }
}

async function handleBossResult(data, trail, feedback) {
  const activTrail = () =>
    state.campaign?.trails.find((t) => t.order === state.currentTrailOrder) ?? trail;

  if (data.correct) {
    const bossLength = activTrail().boss?.length ?? 0;
    const last = state.bossIndex >= bossLength - 1;
    if (last) {
      toast('🐉 Boss derrotado!  +50 XP', true);
      state.bossIndex = 0;
      await maybeAdvanceTrail();
    } else {
      state.bossIndex += 1;
      toast('✓ Questão do boss respondida!');
      renderBoss(activTrail());
    }
  } else {
    feedback.className = 'feedback bad';
    feedback.textContent = `✗ Errado — resposta: ${formatAnswer(data.correctAnswer)}. O boss reinicia!`;
    setTimeout(() => {
      const t = activTrail();
      state.bossIndex = 0;
      renderBoss(t);
    }, 1200);
  }
}

// Recarrega a campanha; se a trilha desbloqueada mudou, re-renderiza a view.
async function maybeAdvanceTrail() {
  const { data } = await fetchCampaign(state.campaignId);
  if (!data) return;
  state.campaign = data;
  const trail = currentTrail();
  const newOrder = trail ? trail.order : null;
  if (newOrder !== state.currentTrailOrder) {
    if (trail) toast(`🗺️ Trilha ${trail.order} desbloqueada: ${trail.name}`);
    render();
  } else {
    renderTrailsNav();
  }
}

// ---- Revisão ----
async function onReview() {
  const panel = $('review-panel');
  const { status, data } = await fetchReview();
  panel.hidden = false;
  if (status === 204 || !data) {
    panel.innerHTML = `<h3>📚 Revisão</h3><p class="muted">Nada para revisar ainda — erre uma questão e ela aparece aqui.</p>`;
    return;
  }
  panel.innerHTML = `<h3>📚 Revise esta</h3><div id="review-card"></div>`;
  const trail = currentTrail();
  const card = questCard(data, trail);
  panel.querySelector('#review-card').appendChild(card);
  renderMath(panel);
}

// ---- Inicialização ----
window.addEventListener('DOMContentLoaded', () => {
  $('source').value = SAMPLE;
  $('load-sample').addEventListener('click', () => {
    $('source').value = SAMPLE;
    $('create-error').hidden = true;
  });
  $('generate-btn').addEventListener('click', onGenerate);
  $('review-btn').addEventListener('click', onReview);
  $('restart-btn').addEventListener('click', () => location.reload());


  refreshLobby();
  refreshHud();
});
