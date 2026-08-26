'use strict';

// ---- Campanha de exemplo (corresponde a examples/sample-campaign.txt) ----
const SAMPLE = `CAMPANHA: Noções Básicas de Biologia Celular

TRILHA: A Célula
ORDEM: 1
Q: Qual organela armazena o material genético da célula?
R: Núcleo
Q: Qual organela é a central de energia da célula?
A: {Parede celular, *Mitocôndria, Ribossomo, Núcleo}
L: O {núcleo} armazena o DNA, enquanto os ribossomos produzem {proteínas}.
BOSS
Q: O que envolve e protege toda a célula?
R: Membrana celular
L: As células vegetais possuem, adicionalmente, uma {parede celular} rígida.

TRILHA: DNA e Genética
ORDEM: 2
Q: Quantas fitas possui a dupla hélice de DNA?
R: 2
Q: Qual molécula transporta a informação genética do DNA para os ribossomos?
A: {tRNA, rRNA, *mRNA, snRNA}
L: O DNA é composto por unidades repetitivas chamadas {nucleotídeos}.
BOSS
Q: Qual base se pareia com a adenina no DNA?
R: {Guanina, Citosina, *Timina, Uracila}`;

// ---- Identidade do jogador (sem autenticação: um id salvo no navegador) ----
const PLAYER_ID_KEY = 'eduquest_player_id';
function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}
function setPlayerId(id) {
  localStorage.setItem(PLAYER_ID_KEY, id);
}

// ---- Estado da aplicação ----
const state = {
  playerId: getPlayerId(),
  campaignId: null,
  campaign: null,
  currentTrailOrder: null,
  currentQuestIndex: 0,
  bossIndex: 0,
  completed: new Set(), // ids das quests respondidas corretamente nesta sessão
};

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

// ---- API ----
async function api(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

const generateCampaign = (text) =>
  api('POST', `/players/${state.playerId}/campaigns/generate`, { text });
const fetchCampaign = (id) => api('GET', `/campaigns/${id}`);
const fetchPlayer = () => api('GET', `/players/${state.playerId}`);
const fetchReview = () => api('GET', `/players/${state.playerId}/review`);
const sendAnswer = (campaignId, questId, answer) =>
  api(
    'POST',
    `/players/${state.playerId}/campaigns/${campaignId}/quests/${questId}/answer`,
    { answer },
  );
const listCampaigns = () => api('GET', `/players/${state.playerId}/campaigns`);
const deleteCampaign = (id) => api('DELETE', `/players/${state.playerId}/campaigns/${id}`);

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
  state.completed = new Set();
  state.bossIndex = 0;
  $('create-panel').hidden = true;
  $('play-panel').hidden = false;
  await refreshHud();
  render();
}

// ---- Fluxo de geração ----
async function onGenerate() {
  const text = $('source').value.trim();
  const errEl = $('create-error');
  errEl.hidden = true;
  if (!text) {
    errEl.textContent = 'Cole o texto da campanha primeiro (ou carregue o exemplo).';
    errEl.hidden = false;
    return;
  }
  const { status, data } = await generateCampaign(text);
  if (status !== 201 || !data) {
    errEl.textContent = (data && data.error) || 'Não foi possível gerar a campanha.';
    errEl.hidden = false;
    return;
  }
  state.campaignId = data.id;
  state.campaign = data;
  state.completed = new Set();
  state.bossIndex = 0;
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
  state.bossIndex = 0;
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
    maybeAdvanceTrail(); // trail may already be complete on the server
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
    feedback.textContent = `✗ Errado — resposta: ${formatAnswer(data.correctAnswer)}. A trilha reinicia!`;
    setTimeout(() => {
      const t = activTrail();
      (t.quests ?? []).forEach((q) => state.completed.delete(q.id));
      state.currentQuestIndex = 0;
      state.bossIndex = 0;
      renderCurrentQuest(t);
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

  const playerIdInput = $('player-id-input');
  playerIdInput.value = state.playerId;
  playerIdInput.addEventListener('change', () => {
    const value = playerIdInput.value.trim();
    if (!value) {
      playerIdInput.value = state.playerId;
      return;
    }
    setPlayerId(value);
    location.reload();
  });

  refreshLobby();
  refreshHud();
});
