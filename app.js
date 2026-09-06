// ============================================================
// DAWG — daily check-in system
// Vanilla JS, localStorage persistence. No build step.
// ============================================================

const STORAGE_KEYS = {
  goals: "dawg_goals_v1",
  data: "dawg_data_v1",
  settings: "dawg_settings_v1",
  workoutExercises: "dawg_workout_exercises_v1",
  workoutSessions: "dawg_workout_sessions_v1",
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
  { id: "g2", category: "fitness", label: "Hit 10,000 steps" },
  { id: "g3", category: "fitness", label: "Mobility / stretch session" },
  // Nutrition
  { id: "n1", category: "nutrition", label: "Meals tracked & calories hit" },
  { id: "n2", category: "nutrition", label: "Water goal hit (3L+)" },
  { id: "n3", category: "nutrition", label: "No junk / processed food" },
  { id: "n4", category: "nutrition", label: "Supplements taken" },
  // Study
  { id: "s1", category: "study", label: "1 module complete" },
  { id: "s2", category: "study", label: "Anki fully completed" },
  { id: "s3", category: "study", label: "3 practice questions (Qbank) done" },
  { id: "s4", category: "study", label: "Lecture / rotation review done" },
  // Discipline
  { id: "d1", category: "discipline", label: "Up at 5:30, no snooze" },
  { id: "d2", category: "discipline", label: "7+ hours sleep last night" },
  { id: "d3", category: "discipline", label: "No scrolling phone on first wake up" },
  { id: "d4", category: "discipline", label: "Reflected & planned tomorrow" },
];

const CATEGORIES = [
  { id: "fitness", label: "Fitness", icon: "\u{1F4AA}" },
  { id: "nutrition", label: "Nutrition", icon: "\u{1F957}" },
  { id: "study", label: "Med School", icon: "\u{1F9E0}" },
  { id: "discipline", label: "Discipline", icon: "\u{1F525}" },
];

const WORKOUT_DAYS = [
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "quads", label: "Quads & Glutes" },
];

const DEFAULT_WORKOUT_EXERCISES = {
  push: ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdown", "Lateral Raise"],
  pull: ["Deadlift", "Barbell Row", "Lat Pulldown", "Face Pull", "Bicep Curl"],
  quads: ["Squat", "Leg Press", "Walking Lunges", "Leg Extension", "Hip Thrust"],
};

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

function loadWorkoutExercises() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.workoutExercises);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const fresh = JSON.parse(JSON.stringify(DEFAULT_WORKOUT_EXERCISES));
  saveWorkoutExercises(fresh);
  return fresh;
}

function saveWorkoutExercises(obj) {
  try {
    localStorage.setItem(STORAGE_KEYS.workoutExercises, JSON.stringify(obj));
  } catch (e) {}
}

function loadWorkoutSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.workoutSessions);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { push: [], pull: [], quads: [] };
}

function saveWorkoutSessions(obj) {
  try {
    localStorage.setItem(STORAGE_KEYS.workoutSessions, JSON.stringify(obj));
  } catch (e) {}
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
let workoutExercises = loadWorkoutExercises();
let workoutSessions = loadWorkoutSessions();
let currentWorkoutDay = "push";

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

// ---------- workouts view ----------

function getSessionsForDay(day) {
  if (!workoutSessions[day]) workoutSessions[day] = [];
  return workoutSessions[day];
}

function getTodayWorkoutSession(day, createIfMissing) {
  const list = getSessionsForDay(day);
  let session = list.find((s) => s.date === currentDayKey);
  if (!session && createIfMissing) {
    session = { date: currentDayKey, exercises: [] };
    list.push(session);
  }
  return session;
}

function getExerciseEntry(session, name, createIfMissing) {
  let entry = session.exercises.find((e) => e.name === name);
  if (!entry && createIfMissing) {
    entry = { name, sets: [] };
    session.exercises.push(entry);
  }
  return entry;
}

function lastLoggedEntry(day, name) {
  const list = getSessionsForDay(day)
    .filter((s) => s.date !== currentDayKey && s.date < currentDayKey)
    .sort((a, b) => b.date.localeCompare(a.date));
  for (const s of list) {
    const entry = s.exercises.find((e) => e.name === name);
    if (entry && entry.sets.length) return entry;
  }
  return null;
}

function formatSets(sets) {
  return sets
    .map((s) => `${s.weight === "" || s.weight == null ? "?" : s.weight}×${s.reps === "" || s.reps == null ? "?" : s.reps}`)
    .join(", ");
}

function switchWorkoutDay(day) {
  currentWorkoutDay = day;
  renderWorkouts();
}

function renderWorkouts() {
  document.querySelectorAll(".workout-subtab").forEach((t) => {
    t.classList.toggle("active", t.dataset.day === currentWorkoutDay);
  });

  const container = document.getElementById("workout-exercises");
  container.innerHTML = "";

  const exerciseNames = workoutExercises[currentWorkoutDay] || [];
  const session = getTodayWorkoutSession(currentWorkoutDay, false);

  exerciseNames.forEach((name) => {
    const entry = session ? getExerciseEntry(session, name, false) : null;
    const sets = entry ? entry.sets : [];
    const last = lastLoggedEntry(currentWorkoutDay, name);

    const card = document.createElement("div");
    card.className = "exercise-card";

    const head = document.createElement("div");
    head.className = "exercise-head";
    head.innerHTML = `
      <div class="exercise-name">${escapeHtml(name)}</div>
      <div class="exercise-last">${last ? "Last: " + escapeHtml(formatSets(last.sets)) : "No previous data"}</div>
      <div class="exercise-del" title="Remove exercise">✕</div>
    `;
    head.querySelector(".exercise-del").addEventListener("click", () => removeExercise(currentWorkoutDay, name));
    card.appendChild(head);

    const setList = document.createElement("div");
    setList.className = "set-list";
    sets.forEach((set, idx) => {
      const row = document.createElement("div");
      row.className = "set-row";
      row.innerHTML = `
        <span class="set-index">${idx + 1}</span>
        <input type="number" step="0.5" inputmode="decimal" class="set-weight" placeholder="kg" value="${set.weight ?? ""}" />
        <span class="set-x">×</span>
        <input type="number" step="1" inputmode="numeric" class="set-reps" placeholder="reps" value="${set.reps ?? ""}" />
        <div class="item-del set-del" title="Remove set">✕</div>
      `;
      row.querySelector(".set-weight").addEventListener("input", (e) => updateSet(name, idx, "weight", e.target.value));
      row.querySelector(".set-reps").addEventListener("input", (e) => updateSet(name, idx, "reps", e.target.value));
      row.querySelector(".set-del").addEventListener("click", () => removeSet(name, idx));
      setList.appendChild(row);
    });
    card.appendChild(setList);

    const addSetBtn = document.createElement("button");
    addSetBtn.className = "add-set-btn";
    addSetBtn.textContent = "+ Add Set";
    addSetBtn.addEventListener("click", () => addSet(name, last));
    card.appendChild(addSetBtn);

    container.appendChild(card);
  });

  renderWorkoutHistory();
}

function addSet(name, last) {
  const session = getTodayWorkoutSession(currentWorkoutDay, true);
  const entry = getExerciseEntry(session, name, true);
  const prevSet = entry.sets[entry.sets.length - 1];
  let defaultWeight = "";
  if (prevSet && prevSet.weight !== "" && prevSet.weight != null) defaultWeight = prevSet.weight;
  else if (last && last.sets.length) {
    const lastSet = last.sets[last.sets.length - 1];
    if (lastSet.weight !== "" && lastSet.weight != null) defaultWeight = lastSet.weight;
  }
  entry.sets.push({ weight: defaultWeight, reps: "" });
  saveWorkoutSessions(workoutSessions);
  renderWorkouts();
}

function updateSet(name, idx, field, value) {
  const session = getTodayWorkoutSession(currentWorkoutDay, true);
  const entry = getExerciseEntry(session, name, true);
  entry.sets[idx][field] = value === "" ? "" : Number(value);
  saveWorkoutSessions(workoutSessions);
}

function removeSet(name, idx) {
  const session = getTodayWorkoutSession(currentWorkoutDay, false);
  if (!session) return;
  const entry = getExerciseEntry(session, name, false);
  if (!entry) return;
  entry.sets.splice(idx, 1);
  saveWorkoutSessions(workoutSessions);
  renderWorkouts();
}

function addExercise(day, name) {
  if (!workoutExercises[day]) workoutExercises[day] = [];
  workoutExercises[day].push(name);
  saveWorkoutExercises(workoutExercises);
  renderWorkouts();
}

function removeExercise(day, name) {
  workoutExercises[day] = (workoutExercises[day] || []).filter((n) => n !== name);
  saveWorkoutExercises(workoutExercises);
  renderWorkouts();
}

function renderWorkoutHistory() {
  const el = document.getElementById("workout-history-list");
  el.innerHTML = "";
  const list = getSessionsForDay(currentWorkoutDay)
    .filter((s) => s.exercises.some((e) => e.sets.length > 0))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  if (list.length === 0) {
    const dayLabel = WORKOUT_DAYS.find((d) => d.id === currentWorkoutDay).label;
    el.innerHTML = `<div class="empty-note">No ${escapeHtml(dayLabel)} sessions logged yet.</div>`;
    return;
  }

  list.forEach((session) => {
    const row = document.createElement("div");
    row.className = "workout-log-row";
    const isToday = session.date === currentDayKey;
    const lines = session.exercises
      .filter((e) => e.sets.length > 0)
      .map(
        (e) => `
        <div class="workout-log-exercise">
          <span>${escapeHtml(e.name)}</span>
          <span>${escapeHtml(formatSets(e.sets))}</span>
        </div>`
      )
      .join("");
    row.innerHTML = `<div class="workout-log-date">${formatShort(session.date)}${isToday ? " (today)" : ""}</div>${lines}`;
    el.appendChild(row);
  });
}

// ---------- tabs ----------

function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabName));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${tabName}`));
  if (tabName === "history") renderHistory();
  if (tabName === "workouts") renderWorkouts();
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

  document.querySelectorAll(".workout-subtab").forEach((t) => {
    t.addEventListener("click", () => switchWorkoutDay(t.dataset.day));
  });

  const addExerciseInput = document.getElementById("workout-add-exercise-input");
  const addExerciseBtn = document.getElementById("workout-add-exercise-btn");
  const submitExercise = () => {
    const val = addExerciseInput.value.trim();
    if (val) {
      addExercise(currentWorkoutDay, val);
      addExerciseInput.value = "";
    }
  };
  addExerciseBtn.addEventListener("click", submitExercise);
  addExerciseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitExercise();
  });
}

document.addEventListener("DOMContentLoaded", init);
