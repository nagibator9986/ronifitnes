"""Создаёт БД и наполняет её стартовым контентом. Идемпотентно:
уже существующие данные не трогает, можно запускать сколько угодно раз.

    python seeds.py
"""

from extensions import db
from models import ContactMessage, Partner, Project, Service, Setting, User
from utils import unique_slug

DEFAULT_SETTINGS = {
    "hero_badge": "AI-решения под ключ для бизнеса",
    "hero_title": "Инженерия искусственного интеллекта как искусство",
    "hero_subtitle": (
        "IlluminartAI проектирует и внедряет чат-ботов, автономных AI-агентов, "
        "ML-модели и интеллектуальную автоматизацию — от идеи до продакшена."
    ),
    "stat_projects": "40+",
    "stat_projects_label": "реализованных проектов",
    "stat_clients": "25+",
    "stat_clients_label": "довольных клиентов",
    "stat_years": "7+",
    "stat_years_label": "лет в разработке",
    "stat_uptime": "24/7",
    "stat_uptime_label": "поддержка решений",
    "team_name": "Команда IlluminartAI",
    "team_role": "Senior Backend · ML/AI Engineering · Data · Product",
    "team_bio": (
        "Ядро IlluminartAI — senior-инженеры с опытом 7+ лет: backend-разработчики, "
        "ML/AI-инженеры и продуктовые дизайнеры, за плечами которых — "
        "высоконагруженные системы и машинное обучение в реальных бизнес-процессах.\n"
        "Каждый в команде прошёл путь от инженера до архитектора AI-продуктов: "
        "чат-боты, автономные агенты, RAG-системы, компьютерное зрение и "
        "предиктивная аналитика. Вместе мы делаем AI-решения уровня enterprise "
        "доступными компаниям любого масштаба — быстро, прозрачно и с измеримым "
        "результатом."
    ),
    "team_skills": "Python, Flask, FastAPI, PostgreSQL, PyTorch, LLM & RAG, LangChain, Computer Vision, MLOps, Highload",
    "team_quote": "Хороший AI-продукт — это когда технология незаметна, а результат измерим.",
    "team_photo": "",
    "contact_email": "tleubekov.super@gmail.com",
    "contact_phone": "+7 (700) 000-00-00",
    "contact_telegram": "https://t.me/illuminartai",
    "contact_whatsapp": "",
    "contact_address": "Казахстан · Астана / Алматы · работаем по всему миру",
    "social_github": "",
    "social_linkedin": "",
    "social_instagram": "",
}

SERVICES = [
    {
        "icon": "bot",
        "title": "Чат-боты с искусственным интеллектом",
        "description": (
            "Умные ассистенты для поддержки, продаж и HR: понимают свободную речь, "
            "знают вашу базу знаний и передают сложные случаи людям."
        ),
        "features": "Telegram / WhatsApp / веб-виджет\nRAG по вашим документам\nМультиязычность (RU / KZ / EN)\nАналитика диалогов",
    },
    {
        "icon": "agent",
        "title": "Автономные AI-агенты",
        "description": (
            "Агенты, которые не просто отвечают, а действуют: ищут информацию, "
            "заполняют CRM, готовят документы и запускают процессы без участия человека."
        ),
        "features": "Оркестрация инструментов и API\nМульти-агентные сценарии\nHuman-in-the-loop контроль\nИнтеграция с внутренними системами",
    },
    {
        "icon": "brain",
        "title": "ML-модели под задачу",
        "description": (
            "Прогнозирование спроса, скоринг, рекомендации, обнаружение аномалий — "
            "обучаем модели на ваших данных и доводим до продакшена."
        ),
        "features": "Аудит и подготовка данных\nОбучение и валидация моделей\nMLOps: мониторинг и переобучение\nОблако или on-premise",
    },
    {
        "icon": "vision",
        "title": "Компьютерное зрение",
        "description": (
            "Распознавание объектов, дефектов, документов и людей на фото и видео — "
            "контроль качества и безопасность в реальном времени."
        ),
        "features": "Детекция и классификация\nOCR и разбор документов\nВидеоаналитика в реальном времени\nРабота на edge-устройствах",
    },
    {
        "icon": "automation",
        "title": "Интеллектуальная автоматизация",
        "description": (
            "Избавляем команды от рутины: LLM-конвейеры обрабатывают документы, "
            "письма и заявки в разы быстрее и без ошибок."
        ),
        "features": "Разбор документов и писем\nАвтоматическая маршрутизация заявок\nГенерация отчётов и текстов\nИнтеграция с 1С, CRM, ERP",
    },
    {
        "icon": "consult",
        "title": "AI-консалтинг и разработка под ключ",
        "description": (
            "Поможем найти точки роста для AI в вашем бизнесе, посчитаем эффект "
            "и реализуем решение полного цикла — от discovery до поддержки."
        ),
        "features": "AI-аудит процессов\nProof-of-Concept за 2–4 недели\nПолный цикл разработки\nОбучение вашей команды",
    },
]

PROJECTS = [
    {
        "title": "NORA — AI-ассистент поддержки",
        "category": "chatbot",
        "client": "Финтех-компания",
        "tagline": "Чат-бот первой линии поддержки: отвечает на 7 из 10 обращений без оператора.",
        "description": (
            "Для финтех-сервиса с десятками тысяч обращений в месяц построили "
            "AI-ассистента на базе LLM с RAG по внутренней базе знаний.\n\n"
            "Бот работает в веб-чате и Telegram, понимает свободные формулировки, "
            "уточняет детали и бесшовно передаёт сложные кейсы операторам вместе с "
            "полным контекстом диалога. Внедрили контур качества: разметку ответов, "
            "мониторинг галлюцинаций и еженедельное дообучение базы знаний."
        ),
        "tech_stack": "Python, LLM, RAG, LangChain, PostgreSQL, Redis, React",
        "metrics": "−68%|нагрузка на операторов\n9 сек|среднее время ответа\n4.8/5|оценка пользователей",
        "is_featured": True,
    },
    {
        "title": "Sales Copilot — агент для отдела продаж",
        "category": "agent",
        "client": "B2B-дистрибьютор",
        "tagline": "AI-агент сам квалифицирует лиды, готовит КП и заполняет CRM.",
        "description": (
            "Автономный агент подключён к почте, телефонии и CRM компании. Он "
            "слушает звонки, извлекает договорённости, сам создаёт сделки и задачи, "
            "готовит черновики коммерческих предложений по прайс-листу и напоминает "
            "менеджерам о зависших сделках.\n\n"
            "Ключевой принцип — human-in-the-loop: агент готовит действие, человек "
            "подтверждает в один клик."
        ),
        "tech_stack": "Python, AI Agents, Function Calling, FastAPI, amoCRM API, Whisper",
        "metrics": "×3|быстрее обработка лида\n+22%|конверсия в сделку\n15 ч/нед|экономия на менеджера",
        "is_featured": True,
    },
    {
        "title": "DocMind — интеллектуальный разбор документов",
        "category": "automation",
        "client": "Логистический оператор",
        "tagline": "Конвейер OCR + LLM превращает сканы накладных в структурированные данные.",
        "description": (
            "Компания вручную вносила данные из тысяч накладных, счетов и актов. "
            "Мы построили конвейер: OCR распознаёт сканы любого качества, LLM "
            "извлекает поля и сверяет их со справочниками, спорные документы уходят "
            "на ручную проверку.\n\n"
            "Результаты выгружаются напрямую в 1С и ERP заказчика."
        ),
        "tech_stack": "Python, OCR, LLM, Computer Vision, Celery, PostgreSQL, 1С API",
        "metrics": "98.6%|точность извлечения\n×12|быстрее ручного ввода\n0|штрафов за ошибки в данных",
        "is_featured": True,
    },
    {
        "title": "VisionQC — контроль качества на производстве",
        "category": "vision",
        "client": "Производственное предприятие",
        "tagline": "Камеры + нейросеть находят дефекты продукции на конвейере в реальном времени.",
        "description": (
            "Обучили детектор дефектов на собственном датасете предприятия и "
            "развернули его на edge-устройствах прямо в цехе. Система размечает "
            "брак на видеопотоке, останавливает партию при превышении порога и "
            "собирает статистику по сменам и линиям.\n\n"
            "Дашборд для технологов показывает динамику брака и «горячие» узлы линии."
        ),
        "tech_stack": "PyTorch, YOLO, OpenCV, Edge AI, Grafana, TimescaleDB",
        "metrics": "99.2%|выявляемость дефектов\n−35%|потери от брака\n40 мс|на кадр",
        "is_featured": False,
    },
    {
        "title": "Aidana — HR-бот для массового найма",
        "category": "chatbot",
        "client": "Розничная сеть",
        "tagline": "Бот проводит первичные интервью и назначает собеседования 24/7.",
        "description": (
            "Для сети с постоянным массовым наймом создали HR-бота: он общается с "
            "кандидатами в WhatsApp и Telegram, задаёт скрининговые вопросы, "
            "оценивает ответы по критериям вакансии и сам бронирует слоты в "
            "календарях рекрутеров.\n\n"
            "Рекрутеры получают готовую карточку кандидата с расшифровкой и оценкой."
        ),
        "tech_stack": "Python, LLM, WhatsApp Business API, Google Calendar API, PostgreSQL",
        "metrics": "×5|больше обработанных откликов\n−60%|время до собеседования\n24/7|приём кандидатов",
        "is_featured": False,
    },
    {
        "title": "InsightHub — прогноз спроса и запасов",
        "category": "analytics",
        "client": "Сеть розничных магазинов",
        "tagline": "ML-платформа прогнозирует продажи и планирует закупки по каждой точке.",
        "description": (
            "Построили платформу прогнозирования спроса: модели учитывают "
            "сезонность, акции, погоду и локальные события. Система ежедневно "
            "пересчитывает прогноз по каждому SKU и магазину и формирует "
            "рекомендации по закупкам.\n\n"
            "Закупщики работают в веб-кабинете с прозрачными объяснениями прогноза."
        ),
        "tech_stack": "Python, Gradient Boosting, Time Series, Airflow, ClickHouse, React",
        "metrics": "−27%|излишки на складе\n−41%|упущенные продажи\nMAPE 8%|точность прогноза",
        "is_featured": False,
    },
]

PARTNERS = [
    {"name": "TechnoPark KZ", "description": "Технологический парк — совместные R&D-проекты"},
    {"name": "FinCore Bank", "description": "AI-ассистент поддержки и антифрод-аналитика"},
    {"name": "MedApp Clinic", "description": "Автоматизация записи и разбора медицинских документов"},
    {"name": "RetailPro Group", "description": "Прогнозирование спроса для розничной сети"},
    {"name": "LogiTrans", "description": "Интеллектуальная обработка транспортных документов"},
    {"name": "EduSmart Academy", "description": "AI-тьютор и проверка заданий для онлайн-школы"},
]


def ensure_seed_data(verbose: bool = False) -> None:
    """Создаёт таблицы и базовый контент, если их ещё нет."""
    db.create_all()

    def log(msg: str):
        if verbose:
            print(msg)

    if User.query.filter_by(username="admin").first() is None:
        admin = User(username="admin", full_name="Администратор IlluminartAI", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        log("✔ админ: admin / admin123 (смените пароль после первого входа!)")

    existing = Setting.get_all()
    for key, value in DEFAULT_SETTINGS.items():
        if key not in existing:
            db.session.add(Setting(key=key, value=value))
    log("✔ настройки лендинга")

    if Service.query.count() == 0:
        for i, s in enumerate(SERVICES):
            db.session.add(Service(order_index=i, **s))
        log(f"✔ услуги: {len(SERVICES)}")

    if Project.query.count() == 0:
        for i, p in enumerate(PROJECTS):
            db.session.add(Project(slug=unique_slug(Project, p["title"]), order_index=i, **p))
        log(f"✔ проекты: {len(PROJECTS)}")

    if Partner.query.count() == 0:
        for i, p in enumerate(PARTNERS):
            db.session.add(Partner(order_index=i, **p))
        log(f"✔ партнёры: {len(PARTNERS)}")

    if ContactMessage.query.count() == 0:
        db.session.add(
            ContactMessage(
                name="Иван Петров",
                email="ivan@example.com",
                company="ООО «Пример»",
                message="Здравствуйте! Хотим внедрить чат-бота для поддержки клиентов. Расскажите, с чего начать?",
            )
        )
        log("✔ демо-заявка")

    db.session.commit()


if __name__ == "__main__":
    from app import create_app

    app = create_app()
    with app.app_context():
        ensure_seed_data(verbose=True)
        print("\nГотово. Запуск: python app.py → http://localhost:5050")
