// ============================================================
// DAWG — daily check-in system
// Vanilla JS, localStorage persistence. No build step.
// ============================================================

const STORAGE_KEYS = {
  goals: "dawg_goals_v1",
  data: "dawg_data_v1",
  settings: "dawg_settings_v1",
};

const QUOTES = [
  "I lied.",
  "I always want to be the best.",
  "I'm obsessed.",
  "I love pressure.",
  "I hate losing.",
  "I love pain.",
  "I love people thinking I'm crazy.",
  "I love being different.",
  "I love discipline.",
];

const DEFAULT_GOALS = [
  // Fitness
  { id: "g1", category: "fitness", label: "Workout completed (lift / run / HIIT)" },
  { id: "g2", category: "fitness", label: "Steps or cardio goal hit" },
  { id: "g3", category: "fitness", label: "Mobility / stretch session" },
  // Nutrition
  { id: "n1", category: "nutrition", label: "Protein target hit" },
  { id: "n2", category: "nutrition", label: "Water goal hit (3L+)" },
  { id: "n3", category: "nutrition", label: "No junk / processed food" },
  { id: "n4", category: "nutrition", label: "Meals planned & logged" },
  // Study
  { id: "s1", category: "study", label: "Deep study block completed" },
  { id: "s2", category: "study", label: "Anki / spaced repetition done" },
  { id: "s3", category: "study", label: "Practice questions (Qbank) done" },
  { id: "s4", category: "study", label: "Lecture / rotation review done" },
  // Discipline
  { id: "d1", category: "discipline", label: "Up at target wake time, no snooze" },
  { id: "d2", category: "discipline", label: "7+ hours sleep last night" },
  { id: "d3", category: "discipline", label: "No phone first 30 min of day" },
  { id: "d4", category: "discipline", label: "Reflected & planned tomorrow" },
];

const CATEGORIES = [
  { id: "fitness", label: "Fitness", icon: "\u{1F4AA}" },
  { id: "nutrition", label: "Nutrition", icon: "\u{1F957}" },
  { id: "study", label: "Med School", icon: "\u{1F9E0}" },
  { id: "discipline", label: "Discipline", icon: "\u{1F525}" },
];

// ---------- storage helpers ----------

function loadGoals() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.goals);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  saveGoals(DEFAULT_GOALS);
  return DEFAULT_GOALS.slice();
}

function saveGoals(goals) {
  try {
    localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  } catch (e) {}
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.data);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(data));
  } catch (e) {}
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { streakThreshold: 80 };
}

// ---------- date helpers ----------

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatShort(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---------- state ----------

let goals = loadGoals();
let data = loadData();
let settings = loadSettings();
let currentDayKey = todayKey();

// ---------- day record helpers ----------

function getDayRecord(key) {
  return data[key] || { checks: {}, notes: "" };
}

function setDayRecord(key, record) {
  data[key] = record;
  saveData(data);
}

function dayCompletionPct(key) {
  if (goals.length === 0) return 0;
  const rec = getDayRecord(key);
  const checkedCount = goals.filter((g) => rec.checks[g.id]).length;
  return Math.round((checkedCount / goals.length) * 100);
}

// ---------- rendering: hero ----------

function renderHero() {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById("hero-quote").textContent = q;
  const d = new Date(currentDayKey + "T00:00:00");
  document.getElementById("hero-date").textContent = d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

let quoteInterval = null;
function startQuoteRotation() {
  if (quoteInterval) clearInterval(quoteInterval);
  quoteInterval = setInterval(() => {
    const el = document.getElementById("hero-quote");
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      el.style.opacity = 1;
    }, 250);
  }, 4500);
}

// ---------- rendering: today view ----------

function renderRing(pct) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `
    <svg width="82" height="82" viewBox="0 0 82 82">
      <circle cx="41" cy="41" r="${r}" fill="none" stroke="#1f241a" stroke-width="7"/>
      <circle cx="41" cy="41" r="${r}" fill="none" stroke="#f4d94a" stroke-width="7"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
    </svg>`;
}

function computeStreak() {
  const threshold = settings.streakThreshold;
  let streak = 0;
  let cursor = new Date();
  // if today isn't at/above threshold yet, start counting from yesterday
  // (today is still "in progress" and shouldn't break the streak early)
  if (dayCompletionPct(todayKey(cursor)) < threshold) {
    cursor = addDays(cursor, -1);
  }
  while (true) {
    const key = todayKey(cursor);
    if (dayCompletionPct(key) >= threshold && data[key]) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

function renderSummary() {
  const pct = dayCompletionPct(currentDayKey);
  const rec = getDayRecord(currentDayKey);
  const checkedCount = goals.filter((g) => rec.checks[g.id]).length;
  const streak = computeStreak();

  document.getElementById("ring-holder").innerHTML = renderRing(pct);
  document.getElementById("ring-pct-text").textContent = pct + "%";
  document.getElementById("summary-sub").textContent =
    `${checkedCount} of ${goals.length} goals locked in`;
  document.getElementById("streak-num").textContent = streak;
}

function renderCategories() {
  const container = document.getElementById("categories");
  container.innerHTML = "";
  const rec = getDayRecord(currentDayKey);

  CATEGORIES.forEach((cat) => {
    const catGoals = goals.filter((g) => g.category === cat.id);
    const checkedCount = catGoals.filter((g) => rec.checks[g.id]).length;

    const card = document.createElement("div");
    card.className = "category";

    const head = document.createElement("div");
    head.className = "category-head";
    head.innerHTML = `
      <div class="category-title"><span class="category-icon">${cat.icon}</span>${cat.label}</div>
      <div class="category-count">${checkedCount}/${catGoals.length}</div>
    `;
    card.appendChild(head);

    const list = document.createElement("div");
    list.className = "item-list";

    catGoals.forEach((g) => {
      const checked = !!rec.checks[g.id];
      const item = document.createElement("div");
      item.className = "item" + (checked ? " checked" : "");
      item.innerHTML = `
        <div class="checkbox">${checked ? "✓" : ""}</div>
        <div class="item-label">${escapeHtml(g.label)}</div>
        <div class="item-del" title="Remove goal">✕</div>
      `;
      item.querySelector(".item-label").addEventListener("click", () => toggleGoal(g.id));
      item.querySelector(".checkbox").addEventListener("click", () => toggleGoal(g.id));
      item.querySelector(".item-del").addEventListener("click", (e) => {
        e.stopPropagation();
        removeGoal(g.id);
      });
      list.appendChild(item);
    });

    card.appendChild(list);

    const addRow = document.createElement("div");
    addRow.className = "add-row";
    addRow.innerHTML = `
      <input type="text" placeholder="Add a ${cat.label.toLowerCase()} goal..." />
      <button>Add</button>
    `;
    const input = addRow.querySelector("input");
    const btn = addRow.querySelector("button");
    const submit = () => {
      const val = input.value.trim();
      if (val) {
        addGoal(cat.id, val);
        input.value = "";
      }
    };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
    card.appendChild(addRow);

    container.appendChild(card);
  });
}

function renderNotes() {
  const rec = getDayRecord(currentDayKey);
  const ta = document.getElementById("notes-input");
  ta.value = rec.notes || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- mutations ----------

function toggleGoal(goalId) {
  const rec = getDayRecord(currentDayKey);
  rec.checks[goalId] = !rec.checks[goalId];
  setDayRecord(currentDayKey, rec);
  renderSummary();
  renderCategories();
}

function addGoal(category, label) {
  const id = "custom_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  goals.push({ id, category, label });
  saveGoals(goals);
  renderSummary();
  renderCategories();
}

function removeGoal(goalId) {
  goals = goals.filter((g) => g.id !== goalId);
  saveGoals(goals);
  // strip from all historical records too (keeps pct calculations honest going forward only)
  renderSummary();
  renderCategories();
}

function updateNotes(text) {
  const rec = getDayRecord(currentDayKey);
  rec.notes = text;
  setDayRecord(currentDayKey, rec);
}

// ---------- history view ----------

function renderHistory() {
  const days = Object.keys(data).sort();
  const totalDays = days.length;
  const threshold = settings.streakThreshold;
  const winDays = days.filter((k) => dayCompletionPct(k) >= threshold).length;
  const avgPct = totalDays
    ? Math.round(days.reduce((sum, k) => sum + dayCompletionPct(k), 0) / totalDays)
    : 0;

  document.getElementById("stat-streak").textContent = computeStreak();
  document.getElementById("stat-winrate").textContent = totalDays ? `${winDays}/${totalDays}` : "0/0";
  document.getElementById("stat-avg").textContent = avgPct + "%";

  renderHeatmap();
  renderLogList();
}

function renderHeatmap() {
  const el = document.getElementById("heatmap");
  el.innerHTML = "";
  const numDays = 84; // 12 weeks
  const today = new Date();
  for (let i = 0; i < numDays; i++) {
    const d = addDays(today, -i);
    const key = todayKey(d);
    const pct = dayCompletionPct(key);
    let level = 0;
    if (data[key]) {
      if (pct >= 90) level = 4;
      else if (pct >= 60) level = 3;
      else if (pct >= 30) level = 2;
      else if (pct > 0) level = 1;
    }
    const cell = document.createElement("div");
    cell.className = "heatmap-cell" + (i === 0 ? " today" : "");
    cell.setAttribute("data-level", level);
    cell.title = `${key}: ${data[key] ? pct + "%" : "no entry"}`;
    el.appendChild(cell);
  }
}

function renderLogList() {
  const el = document.getElementById("log-list");
  el.innerHTML = "";
  const days = Object.keys(data).sort().reverse().slice(0, 21);
  if (days.length === 0) {
    el.innerHTML = `<div class="empty-note">No check-ins logged yet. Get after today's goals.</div>`;
    return;
  }
  days.forEach((key) => {
    const pct = dayCompletionPct(key);
    const row = document.createElement("div");
    row.className = "log-row";
    row.innerHTML = `
      <div class="log-date">${formatShort(key)}</div>
      <div class="log-bar-bg"><div class="log-bar-fill" style="width:${pct}%"></div></div>
      <div class="log-pct">${pct}%</div>
    `;
    el.appendChild(row);
  });
}

// ---------- tabs ----------

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${tabName}`));
  if (tabName === "history") renderHistory();
}

// ---------- init ----------

function init() {
  renderHero();
  startQuoteRotation();
  renderSummary();
  renderCategories();
  renderNotes();

  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => switchTab(t.dataset.tab));
  });

  document.getElementById("notes-input").addEventListener("input", (e) => {
    updateNotes(e.target.value);
  });
}

document.addEventListener("DOMContentLoaded", init);
