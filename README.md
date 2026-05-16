# RoniFitness

Премиальная платформа персонального тренинга для тренера Руслана.

**Стек:** Flask 3 + SQLAlchemy 2 + SQLite/PostgreSQL · React 18 + Vite · собственная CSS-дизайн-система.

Архитектура и конвенции — [CLAUDE.md](CLAUDE.md).

## Возможности

| Роль       | Что доступно                                                                              |
|------------|-------------------------------------------------------------------------------------------|
| Лендинг    | Hero · биография · галерея из 25 фото                                                     |
| Клиент     | Анкета · план тренировок · план питания · **календарь** · **тренировочный плеер** (таймер отдыха, счётчик сетов) · прогресс-фото с **side-by-side сравнением** · замеры тела с графиками · **достижения** · чат · уведомления |
| Тренер     | **Обзор** (pending-задачи · активность) · клиенты · **расписание** (день/неделя) · **финансы** (платежи, заработок) · библиотека упражнений · шаблоны программ · заметки по клиенту |
| Админ      | Пользователи · per-trainer статистика · глобальная лента активности · редактор лендинга и галереи |

Плюс **PWA-манифест** и полная мобильная адаптация (bottom-nav, bottom-sheet модалки).

---

## Локальный запуск

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seeds.py            # создаёт БД + демо данные (идемпотентно)
python app.py              # → http://localhost:5050
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # → http://localhost:5173 (проксирует /api → 5050)
```

Откройте **http://localhost:5173/**.

### Демо-логины

| Логин       | Пароль     | Роль                                |
|-------------|------------|-------------------------------------|
| `admin`     | `admin123` | Суперадмин                          |
| `ruslan`    | `ruslan123`| Тренер                              |
| `demo`      | `demo123`  | Клиент с готовым планом + замерами  |
| `newclient` | `new123`   | Клиент — увидит анкету при входе    |

---

## 🚀 Деплой на Railway

### Шаг 1. Подготовить репозиторий

```bash
cd ronifitnes
git init
git add .
git commit -m "RoniFitness initial commit"
gh repo create ronifitness --public --source=. --push
# или вручную: git push на свой GitHub
```

### Шаг 2. Создать сервис на Railway

1. Зайдите на https://railway.app → **New Project** → **Deploy from GitHub repo**.
2. Выберите репозиторий `ronifitness`. Railway увидит `railway.json` и `nixpacks.toml` и автоматически:
   - установит Node 20 и Python 3.11;
   - выполнит `npm ci && npm run build` во `frontend/`;
   - установит `pip install -r requirements.txt` в `backend/`;
   - запустит `gunicorn` на `$PORT`.

### Шаг 3. Добавить PostgreSQL (рекомендуется)

В проекте на Railway: **+ New** → **Database** → **Add PostgreSQL**.
Railway автоматически прокинет `DATABASE_URL` в ваш Flask-сервис. Приложение само понимает оба варианта (SQLite ↔ Postgres).

### Шаг 4. Указать переменные окружения

В сервисе Flask → **Variables**:

| Переменная        | Значение                                         |
|-------------------|--------------------------------------------------|
| `SECRET_KEY`      | длинная случайная строка (32+ символов)          |
| `JWT_SECRET`      | другая длинная случайная строка                  |
| `FLASK_ENV`       | `production`                                     |
| `ALLOWED_ORIGINS` | (опц.) `https://your-app.up.railway.app`          |
| `UPLOAD_DIR`      | (если подключили Volume) `/data/uploads`         |

> Скопировать пример: [`.env.example`](.env.example).

### Шаг 5. (опц.) Подключить Volume для пользовательских загрузок

Без Volume аватарки и фото прогресса будут стираться при каждом redeploy.

1. В Railway: **+ New** → **Volume** → mount path `/data`.
2. Добавьте переменную `UPLOAD_DIR=/data/uploads`.

### Шаг 6. Открыть приложение

Railway выдаст URL вида `https://ronifitness-production.up.railway.app`. На первом запросе backend автоматически создаст таблицы и засеет демо-данные.

> Сменить дефолтные пароли админа/тренера сразу после первого входа.

---

## Production-сборка вручную

```bash
cd frontend && npm run build           # → frontend/dist/
cd ../backend && FLASK_ENV=production gunicorn -w 2 -b 0.0.0.0:8000 app:app
# теперь Flask сам отдаёт собранный React на /, и API на /api/*
```

---

## Структура

```
ronifitnes/
├── CLAUDE.md, README.md, .env.example, .gitignore
├── Procfile, railway.json, nixpacks.toml      ← deploy
├── backend/
│   ├── app.py            ← Flask app + SPA fallback
│   ├── config.py         ← DATABASE_URL / env-aware
│   ├── models.py         ← User, Questionnaire, Exercise, WorkoutPlan, …,
│   │                       Payment, ScheduleEvent, Notification, TrainerNote, …
│   ├── seeds.py          ← seed_logic() — авто-сидится при первом старте
│   ├── routes/
│   │   ├── auth.py, public.py
│   │   ├── trainer.py, client.py, admin.py
│   │   ├── notifications.py
│   │   ├── finance.py    ← /api/trainer/finance/*
│   │   └── schedule.py   ← /api/trainer/schedule/*
│   ├── static/trainer/   ← 25 фото лендинга
│   └── uploads/          ← аватары / прогресс / медиа упражнений
└── frontend/
    ├── package.json, vite.config.js
    ├── public/manifest.webmanifest
    └── src/
        ├── main.jsx, App.jsx, api.js, auth.jsx
        ├── components/   ← Layout, Modal, Toast, Chart, NotificationBell, Skeleton, common
        ├── styles/       ← tokens.css, app.css
        └── pages/
            ├── Landing, Login, Questionnaire
            ├── client/   ← Dashboard, Plan, Calendar, Progress, Achievements,
            │              Chat, Profile, WorkoutPlayer
            ├── trainer/  ← Overview, Clients, ClientDetail, Library, Templates,
            │              Schedule, Finance
            └── admin/    ← Users, Trainers, Activity, Gallery
```
