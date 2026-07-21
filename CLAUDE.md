# CLAUDE.md

Гайд для Claude Code по работе с этим репозиторием.

## Что это

Сайт компании **IlluminartAI** (AI-решения для бизнеса): публичный лендинг и
админ-панель. Монорепо: Flask-бэкенд (`backend/`) + React-фронтенд (`frontend/`).
Язык интерфейса и контента — русский.

## Команды

```bash
# backend (Python 3.11+)
cd backend
pip install -r requirements.txt
python seeds.py            # создать БД + демо-контент (идемпотентно)
python app.py              # dev-сервер на :5050

# frontend (Node 20+)
cd frontend
npm install
npm run dev                # Vite на :5173, /api и /uploads проксируются на :5050
npm run build              # прод-сборка в frontend/dist (её раздаёт Flask)
```

Тестов и линтеров в проекте нет. Проверка — ручная: `npm run build` должен
проходить без ошибок, `python -m compileall backend` — без синтаксических ошибок,
`curl localhost:5050/api/health` — отвечать `{"status": "ok"}`.

## Архитектура

**Backend** — Flask app factory (`app.py: create_app`), расширения в
`extensions.py` (SQLAlchemy, JWT, CORS). При старте приложение само вызывает
`seeds.ensure_seed_data()` — создаёт таблицы и базовый контент, если их нет.

- `models.py` — `User` (только админы), `Service`, `Project`, `Partner`,
  `ContactMessage`, `Setting` (key-value для всех текстов лендинга).
  Многострочные поля хранятся текстом: `Project.metrics` — строки
  `значение|подпись`, `Service.features` — пункт на строку, `tech_stack` — через
  запятую. `to_dict()` отдаёт и разобранный вид, и `*_raw` для форм админки.
- Роуты: `routes/public.py` (без авторизации: `/api/public/landing`,
  `/api/public/contact`), `routes/auth.py` (JWT-вход), `routes/admin.py`
  (CRUD + `/api/admin/upload` + настройки; всё под `@role_required("admin")`).
- Flask раздаёт собранный SPA из `frontend/dist` (catch-all роут) и загруженные
  файлы из `UPLOAD_DIR` под `/uploads/`.
- БД: SQLite по умолчанию (`backend/illuminartai.db`, в gitignore);
  `DATABASE_URL` переключает на PostgreSQL (postgres:// нормализуется).

**Frontend** — Vite + React 18 + react-router. Точки входа: `src/pages/Landing.jsx`
(одностраничный лендинг из секций `src/components/landing/*`),
`src/pages/Admin.jsx` (вкладки), `src/pages/AdminLogin.jsx`.

- `src/api.js` — axios с JWT из localStorage (`ia_token`) и редиректом на
  `/admin/login` при 401 на админ-страницах.
- Админ-CRUD построен на одном универсальном компоненте
  `components/admin/CollectionTab.jsx`: конфиги полей/колонок для проектов,
  партнёров и услуг объявлены в `pages/Admin.jsx`. Новую сущность добавлять по
  этому же паттерну, а не копированием вкладки.
- Стили — чистый CSS: токены в `src/styles/tokens.css`, всё остальное в
  `src/styles/global.css`. Никаких CSS-фреймворков; классы — kebab-case.
- Дизайн — строгий монохром под фирменный логотип
  (`frontend/public/brand/logo.jpg`, кубистическая статуя): чёрный/«бумага»
  (`--ink`/`--paper`), нулевые скругления, серифный дисплей Playfair Display +
  JetBrains Mono для подписей. Светлые секции — класс `.sec-paper`
  (инвертирует семантические переменные `--s-*`); цветных акцентов не вводить.
- Иконки — единый компонент `components/Icon.jsx` (inline SVG). Обложки проектов
  и логотипы партнёров без картинок рендерятся генеративно (градиент/монограмма).

## Конвенции

- Ответы API: `{"items": [...]}` для списков, `{"item": {...}}` для одной
  сущности, `{"error": "текст по-русски"}` для ошибок — фронт показывает
  `error` как есть (`apiError()`).
- Тексты лендинга не хардкодить в JSX — они живут в `Setting` и редактируются
  в админке (`SettingsTab`); новые ключи добавлять в `DEFAULT_SETTINGS` в
  `seeds.py`.
- Деплой: Railway/Nixpacks (`nixpacks.toml`, `Procfile`, `railway.json`) — один
  образ, gunicorn из `/opt/venv`. Healthcheck: `/api/health`.
- Сид-админ: `admin` / `admin123` (только для разработки).
