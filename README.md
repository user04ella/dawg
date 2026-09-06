# DAWG — Daily Check-In System

A no-nonsense daily check-in for fitness, nutrition, med-school study, and discipline. Built to match one mindset: *I love pressure. I hate losing. I love discipline.*

No backend, no build step, no account. Static HTML/CSS/JS, data saved locally in your browser.

## Run it

Just open `index.html` in a browser — double-click it, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or deploy it for free with GitHub Pages: Settings → Pages → deploy from this branch, root folder.

## What it does

**Today tab**
- Checklist grouped into Fitness / Nutrition / Med School / Discipline
- A completion ring + streak counter (a "win" day = hitting your threshold %, default 80%)
- Add or remove your own goals per category any time
- A daily notes/reflection box

**The goal list (finalized)**

| Fitness | Nutrition | Med School | Discipline |
|---|---|---|---|
| Workout completed (lift / run / HIIT) | Meals tracked & calories hit | 1 module complete | Up at 5:30, no snooze |
| Hit 10,000 steps | Water goal hit (3L+) | Anki fully completed | 7+ hours sleep last night |
| Mobility / stretch session | No junk / processed food | 3 practice questions (Qbank) done | No scrolling phone on first wake up |
| | Supplements taken | Lecture / rotation review done | Reflected & planned tomorrow |

**Workouts tab**
- A Monday–Sunday weekly planner with AM and PM sections per day
- Each AM/PM slot holds up to 2 activities — pick from Run / Swim / Cycle / Gym / Walk, and tick the box once it's done
- `‹` / `›` step you a full week back or forward — plan next week on a Sunday, or check what you did 3 weeks ago
- "Jump to this week" snaps back to today's week from anywhere

**History tab**
- Current streak, total win days, and average daily completion
- A 12-week heatmap (darker yellow = more goals hit that day)
- A log of your most recent days

**Hero banner**
- Your inspiration photo (`assets/inspiration.jpg`) with the lines that set the tone, rotating underneath the title.

## Customizing

- **Goals**: use the "Add a ___ goal..." field under each category, or the ✕ on any item to remove it (defaults live in `app.js` under `DEFAULT_GOALS` if you want to change the starting set for a fresh browser).
- **Streak threshold**: `settings.streakThreshold` in `app.js` (default 80 — meaning 80%+ of that day's goals checked counts as a streak day).
- **Colors / vibe**: all in `styles.css` under `:root` — `--accent` is the yellow, `--bg`/`--bg-card` are the near-black greens.

## Data & privacy

Everything is stored in your browser's `localStorage` (`dawg_goals_v1`, `dawg_data_v1`, `dawg_settings_v1`, `dawg_workout_plan_v1`). Nothing leaves your device. This also means:
- Data is per-browser — it won't sync between your phone and laptop unless you host it somewhere and use the same browser profile, or add your own sync layer later.
- Clearing site data / browser storage will wipe your history. There's no export yet — worth adding if you start relying on this daily (happy to add a JSON export/import button on request).
