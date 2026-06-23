'use strict';

// ---- Sample campaign (matches examples/sample-campaign.txt) ----
const SAMPLE = `CAMPANHA: Cell Biology Basics

TRILHA: The Cell
ORDEM: 1
Q: Which organelle stores the cell's genetic material?
R: Nucleus
Q: Which organelle is the powerhouse of the cell?
R: Mitochondria
L: The {nucleus} stores DNA while ribosomes build {proteins}.
BOSS
Q: What surrounds and protects the whole cell?
R: Cell membrane
L: Plant cells additionally have a rigid {cell wall}.

TRILHA: DNA and Genetics
ORDEM: 2
Q: How many strands does a DNA double helix have?
R: 2
L: DNA is made of repeating units called {nucleotides}.
BOSS
Q: Which base pairs with adenine in DNA?
R: Thymine`;

// ---- App state ----
const state = {
  campaignId: null,
  campaign: null,
  currentTrailOrder: null,
  bossIndex: 0,
  completed: new Set(), // quest ids answered correctly this session
};

// ---- DOM helpers ----
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

const generateCampaign = (text) => api('POST', '/campaigns/generate', { text });
const fetchCampaign = (id) => api('GET', `/campaigns/${id}`);
const fetchPlayer = () => api('GET', '/player');
const fetchReview = () => api('GET', '/player/review');
const sendAnswer = (campaignId, questId, answer) =>
  api('POST', `/campaigns/${campaignId}/quests/${questId}/answer`, { answer });

// ---- HUD ----
async function refreshHud() {
  const { data } = await fetchPlayer();
  if (!data) return;
  $('hud').hidden = false;
  $('hud-level').textContent = data.level;
  $('hud-xp').textContent = data.xp;
  $('hud-streak').textContent = data.streak;
  const pct = Math.min(100, Math.round((data.xp / (data.level * 100)) * 100));
  $('hud-xpbar').style.width = `${pct}%`;
  $('hud-bonus').hidden = !data.streakBonusActive;
}

// ---- Generate flow ----
async function onGenerate() {
  const text = $('source').value.trim();
  const errEl = $('create-error');
  errEl.hidden = true;
  if (!text) {
    errEl.textContent = 'Paste some campaign text first (or load the sample).';
    errEl.hidden = false;
    return;
  }
  const { status, data } = await generateCampaign(text);
  if (status !== 201 || !data) {
    errEl.textContent = (data && data.error) || 'Could not generate the campaign.';
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
}

// ---- Rendering ----
function currentTrail() {
  if (!state.campaign) return null;
  return state.campaign.trails.find((t) => t.state === 'UNLOCKED') || null;
}

function render() {
  $('campaign-name').textContent = state.campaign.name;
  renderTrailsNav();

  const trail = currentTrail();
  if (!trail) {
    // no unlocked trail left → campaign cleared
    $('trail-title').textContent = '';
    $('quests').innerHTML = '';
    $('boss').hidden = true;
    $('trail-done').hidden = false;
    $('trail-done').innerHTML = `<h2>🎉 Campaign complete!</h2>
      <p class="muted">Every trail cleared. Use <strong>Review</strong> to revisit tricky questions, or start a new campaign.</p>`;
    return;
  }

  state.currentTrailOrder = trail.order;
  state.bossIndex = 0;
  $('trail-done').hidden = true;
  $('trail-title').textContent = `Trail ${trail.order}: ${trail.name}`;

  $('quests').innerHTML = '';
  trail.quests.forEach((q) => $('quests').appendChild(questCard(q, trail)));

  renderBoss(trail);
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
  const inputs = isFill
    ? Array.from({ length: q.gaps || 1 }, (_, i) => `<input data-gap="${i}" placeholder="Gap ${i + 1}" />`).join('')
    : `<input placeholder="Your answer" />`;

  card.innerHTML = `
    <div class="qtype">${isFill ? 'Fill in the blank' : 'Quiz'}</div>
    <div class="prompt">${esc(q.prompt)}</div>
    <div class="answer-row">
      ${inputs}
      <button class="btn primary">${done ? 'Answered ✓' : 'Submit'}</button>
    </div>
    <div class="feedback ${done ? 'ok' : ''}">${done ? '✓ Solved' : ''}</div>`;

  const button = card.querySelector('button');
  const fields = Array.from(card.querySelectorAll('input'));
  if (done) {
    fields.forEach((f) => (f.disabled = true));
    button.disabled = true;
  }

  const submit = () => handleAnswer({ q, isFill, fields, card, button, trail, boss: opts.boss });
  button.addEventListener('click', submit);
  fields.forEach((f) =>
    f.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    }),
  );
  return card;
}

function renderBoss(trail) {
  const bossEl = $('boss');
  if (!trail.boss || trail.boss.length === 0) {
    bossEl.hidden = true;
    return;
  }
  bossEl.hidden = false;
  const idx = state.bossIndex;
  const q = trail.boss[idx];
  bossEl.innerHTML = `
    <h3>🐉 Boss Challenge</h3>
    <div class="boss-progress">Question ${idx + 1} of ${trail.boss.length} — one mistake restarts the boss!</div>
    <div id="boss-card"></div>`;
  const card = questCard(q, trail, { boss: true });
  bossEl.querySelector('#boss-card').appendChild(card);
}

// ---- Answering ----
async function handleAnswer({ q, isFill, fields, card, button, trail, boss }) {
  const feedback = card.querySelector('.feedback');
  const answer = isFill ? fields.map((f) => f.value) : fields[0].value;
  if (isFill ? answer.some((a) => a.trim() === '') : answer.trim() === '') {
    feedback.className = 'feedback bad';
    feedback.textContent = 'Fill in every box first.';
    return;
  }

  button.disabled = true;
  const { data } = await sendAnswer(state.campaignId, q.id, answer);
  await refreshHud();

  if (!data) {
    feedback.className = 'feedback bad';
    feedback.textContent = 'Something went wrong.';
    button.disabled = false;
    return;
  }

  if (boss) return handleBossResult(data, trail, feedback);

  if (data.correct) {
    state.completed.add(q.id);
    card.classList.add('done');
    fields.forEach((f) => (f.disabled = true));
    button.textContent = 'Answered ✓';
    feedback.className = 'feedback ok';
    feedback.textContent = `✓ Correct!  +${data.xpGained} XP`;
    if (data.leveledUp) toast(`⬆️ Level up! You are now level ${data.newLevel}`, true);
    else toast(`✓ +${data.xpGained} XP`);
    await maybeAdvanceTrail();
  } else {
    feedback.className = 'feedback bad';
    feedback.textContent = '✗ Not quite — added to your review queue.';
    button.disabled = false;
  }
}

async function handleBossResult(data, trail, feedback) {
  if (data.correct) {
    const last = state.bossIndex >= trail.boss.length - 1;
    if (last) {
      toast('🐉 Boss defeated!  +50 XP', true);
      state.bossIndex = 0;
      await maybeAdvanceTrail();
    } else {
      state.bossIndex += 1;
      toast('✓ Boss question cleared!');
      renderBoss(trail);
    }
  } else {
    state.bossIndex = 0;
    renderBoss(trail);
    const bossEl = $('boss');
    const fb = bossEl.querySelector('.feedback');
    if (fb) {
      fb.className = 'feedback bad';
      fb.textContent = '✗ Wrong — the boss resets! Start from question 1.';
    }
  }
}

// Re-fetch the campaign; if the unlocked trail changed, re-render the view.
async function maybeAdvanceTrail() {
  const { data } = await fetchCampaign(state.campaignId);
  if (!data) return;
  state.campaign = data;
  const trail = currentTrail();
  const newOrder = trail ? trail.order : null;
  if (newOrder !== state.currentTrailOrder) {
    if (trail) toast(`🗺️ Trail ${trail.order} unlocked: ${trail.name}`);
    render();
  } else {
    renderTrailsNav();
  }
}

// ---- Review ----
async function onReview() {
  const panel = $('review-panel');
  const { status, data } = await fetchReview();
  panel.hidden = false;
  if (status === 204 || !data) {
    panel.innerHTML = `<h3>📚 Review</h3><p class="muted">Nothing to review yet — miss a question and it shows up here.</p>`;
    return;
  }
  panel.innerHTML = `<h3>📚 Review this one</h3><div id="review-card"></div>`;
  const trail = currentTrail();
  const card = questCard(data, trail);
  panel.querySelector('#review-card').appendChild(card);
}

// ---- Wire up ----
window.addEventListener('DOMContentLoaded', () => {
  $('source').value = SAMPLE;
  $('load-sample').addEventListener('click', () => {
    $('source').value = SAMPLE;
    $('create-error').hidden = true;
  });
  $('generate-btn').addEventListener('click', onGenerate);
  $('review-btn').addEventListener('click', onReview);
  $('restart-btn').addEventListener('click', () => location.reload());
});
