# RoniFitness — Professional Personal-Training Platform

A premium online-coaching platform for personal trainer **Ruslan ("Roni")**.
Three roles: **super-admin**, **trainer**, **client**. The trainer onboards clients,
collects intake questionnaires, builds individualised workout & nutrition programs,
and tracks progress (photos, measurements, completed sessions). Clients log in,
see a polished mobile-first dashboard, follow their plan, upload progress photos
and chat with the trainer.

---

## 1. Tech stack

| Layer          | Choice                                              |
|----------------|-----------------------------------------------------|
| Backend        | Python 3.11+, Flask 3, SQLAlchemy 2, JWT-Extended   |
| DB             | SQLite (dev) / PostgreSQL (prod via `DATABASE_URL`) |
| Server         | gunicorn (gthread workers) in production            |
| Auth           | JWT (access tokens, 30 d), bcrypt password hashing  |
| File uploads   | Local disk under `backend/uploads/…`                |
| Frontend       | React 18 + Vite, React-Router 6, Axios              |
| Styling        | Hand-written CSS design-system (no Tailwind/MUI)    |
| PWA            | manifest + responsive design that feels native      |

The frontend talks to the backend over a single `/api/*` prefix and stores the
JWT in `localStorage` under the key `rf_token`.

---

## 2. Repository layout

```
ronifitnes/
├── CLAUDE.md              ← this file
├── README.md              ← how to run
├── backend/
│   ├── app.py             ← Flask app factory + blueprints registration
│   ├── config.py          ← config constants
│   ├── extensions.py      ← db, jwt, cors singletons
│   ├── models.py          ← all SQLAlchemy models
│   ├── seeds.py           ← creates admin, trainer Ruslan, demo client + gallery
│   ├── utils.py           ← password gen, slug, file helpers
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py        ← /login, /me
│   │   ├── admin.py       ← admin-only endpoints
│   │   ├── trainer.py     ← trainer endpoints (clients, plans, library)
│   │   ├── client.py      ← client endpoints (own plan, photos, log)
│   │   └── public.py      ← public landing data (trainer bio + gallery)
│   ├── static/trainer/    ← 25 photos of Ruslan (gallery)
│   └── uploads/           ← runtime user uploads
│       ├── avatars/
│       ├── progress/
│       └── exercises/
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/manifest.webmanifest
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js          ← axios instance with auth interceptor
        ├── auth.jsx        ← AuthProvider + useAuth
        ├── styles/         ← global CSS + design tokens
        ├── components/     ← Layout, BottomNav, Modal, ExerciseCard, etc.
        └── pages/          ← Landing, Login, Dashboard, Plan, Library, …
```

---

## 3. Domain model (SQLAlchemy)

* `User` — id, username, password_hash, role ∈ {admin, trainer, client},
  full_name, email, phone, avatar_url, trainer_id (FK self), is_active,
  needs_questionnaire (clients only), created_at.
* `Questionnaire` — one-to-one with client User. Birth-year, gender, height,
  weight, target weight, training experience, goals (multi-line), injuries,
  diseases, allergies, diet preferences, available_days (CSV), available_time,
  equipment access, sleep_hours, water_intake_l, motivation, free_notes,
  submitted_at.
* `Exercise` — trainer's reusable library. Name, muscle_group, purpose,
  instructions, media_kind ∈ {image,gif,youtube,none}, media_url.
* `WorkoutPlan` — belongs to client + trainer. Name, description, is_active,
  start_date.
* `WorkoutDay` — belongs to plan. day_of_week (0..6), time_of_day (HH:MM),
  title, notes.
* `WorkoutItem` — belongs to WorkoutDay → Exercise. sets, reps, rest_sec,
  weight_kg, notes, order_index.
* `NutritionPlan` — per client. Name, target_kcal, protein_g, carbs_g, fat_g.
* `Meal` — per plan. day_of_week (or NULL = every day), meal_type
  ∈ {breakfast,lunch,dinner,snack}, time_of_day, name, description,
  kcal, protein, carbs, fat.
* `ProgressPhoto` — client uploads. period_label (before / 1m / 3m / 6m / 1y /
  custom), pose (front/side/back), file_url, taken_at, notes.
* `Measurement` — weight, body_fat_pct, chest, waist, hips, biceps, thighs,
  calves, taken_at, notes.
* `WorkoutLog` — completed session marker (workout_day_id, completed_at,
  duration_min, mood (1..5), notes).
* `Message` — sender_id, receiver_id, content, sent_at, is_read.
* `GalleryPhoto` — public gallery entry (file path, caption, order_index).
* `Setting` — key/value singletons (trainer bio, hero text, contacts).
* `Notification` — per-user in-app notifications (anketa submitted, plan updated, message, workout done).
* `TrainerNote` — private notes a trainer writes about a client (pinned/regular).
* `PlanTemplate` — reusable workout-plan template; can be created from any existing plan.
* `SetLog` — detailed per-set log inside a `WorkoutLog` (weight, reps, RPE).
* `Payment` — monthly payment from a client to a trainer (unique per client × year × month).
* `ScheduleEvent` — trainer's schedule slot. Either one-off (`event_date` set) or recurring weekly (`day_of_week` set).
* `User.monthly_fee` / `User.currency` — per-client price set by the trainer.

All FKs cascade delete where it makes sense (deleting a plan deletes its days
and items; deleting a client deletes their questionnaire/photos/logs).

---

## 4. Auth & roles

* `POST /api/auth/login` → `{access_token, user}`.
* Every protected route uses `@jwt_required()` plus a `role_required(...)` decorator.
* Trainer can only see/modify clients where `client.trainer_id == trainer.id`.
* Admin can do everything trainer can do **plus** create trainers, deactivate
  users, edit landing-page content & gallery.
* Clients can only read/edit their own data.

Seed accounts:
* `admin / admin123` — super-admin
* `ruslan / ruslan123` — trainer (the homepage personality)
* `demo / demo123` — demo client with full sample plan

---

## 5. Key flows

### 5.1 Trainer creates a client
1. Trainer opens **My Clients → New Client**.
2. Enters full name + checkbox "New client (needs questionnaire)".
3. Backend auto-generates simple `username` (translit of name + 3 digits) and
   `password` (6 chars). Returns both in the response so the trainer can copy.
4. If `needs_questionnaire=true`, the client sees the intake form right after
   their first login. Once submitted, the form locks and appears in the
   trainer's view.

### 5.2 Trainer builds a workout plan
* `Library` tab → create reusable exercises (with YouTube/GIF/image).
* Open a client → **Workout Plan** tab → "New Plan" → pick days of the week
  (Mon/Wed/Fri etc.) and time → for each day add exercises from the library
  with sets/reps/rest/weight.
* Same shape for **Nutrition Plan**, but with meals per day.

### 5.3 Client side
* Mobile-first dashboard: today's training (if any), today's meals, quick
  stats, "tap to mark as done".
* Plan view shows the whole week as cards.
* **Progress** tab: upload photos by period (Before / 1m / 3m / 6m / 1y /
  custom) — every period bucket shows front/side/back tiles. Plus a body
  measurements log with charts (sparkline).
* **Chat** tab: simple text chat with the trainer.

### 5.4 Public landing
* `/` is reachable without login.
* Big hero with Ruslan's name + tagline, photo gallery (the 25 images),
  achievements/bio, CTA "Login" / "Get in touch".

---

## 6. Design system

**Theme:** dark, athletic, premium. Background almost black with subtle grain,
fire-orange → red accent gradient (`#ff5722 → #ff1744`), crisp white text.
Typography: `Inter` for body, big condensed headings via `font-weight: 900`
with letter-spacing for the "FITNESS" vibe.

Tokens (CSS custom properties in `styles/tokens.css`):
```
--bg            #0b0b0e
--bg-elev       #15151b
--bg-card       #1c1c24
--border        #262631
--text          #f4f4f6
--muted         #9a9aa8
--brand         linear-gradient(135deg,#ff7a18,#ff1744)
--brand-solid   #ff4d2e
--success       #22c55e
--warn          #f59e0b
--danger        #ef4444
--radius        14px
--shadow        0 10px 30px rgba(0,0,0,.45)
```

Components: `.btn`, `.btn-ghost`, `.card`, `.chip`, `.input`, `.tabs`,
`.bottom-nav`, `.stat`, `.modal`. All built with plain CSS so the bundle stays
tiny.

**Mobile:** below 768 px the side-nav collapses, a sticky **bottom nav**
appears (Home / Plan / Progress / Chat / Profile). Cards use full width,
inputs are 48px tall, tap-targets ≥ 44px. The PWA manifest lets the user
"Add to Home Screen" and run it full-screen.

---

## 7. Running locally

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seeds.py            # creates db + demo data (idempotent)
python app.py              # → http://localhost:5050

# frontend
cd ../frontend
npm install
npm run dev                # → http://localhost:5173 (proxies /api → 5050)
```

Default logins:
* `admin / admin123`
* `ruslan / ruslan123`
* `demo / demo123`

---

## 8. Conventions for future edits

* **Don't** introduce ORMs/auth libs beyond what's in `requirements.txt`.
* **Don't** add Tailwind/MUI/Bootstrap — keep the hand-rolled design-system.
* All new endpoints live under a blueprint in `backend/routes/` and are
  guarded by `role_required`.
* Frontend pages live under `src/pages/`; only export a default React
  component. Shared UI goes into `src/components/`.
* When adding a model field, also update `to_dict()` and any seed.
* Russian is the primary UI language (target user is a Russian-speaking
  trainer & his clients). Use Russian copy in pages; keep code identifiers
  English.
