"""Idempotent seed script. Run: python seeds.py"""
import os
from pathlib import Path
from datetime import date, datetime, timedelta

from extensions import db
from models import (
    User, Questionnaire, Exercise, WorkoutPlan, WorkoutDay, WorkoutItem,
    NutritionPlan, Meal, GalleryPhoto, Setting, ProgressPhoto, Measurement,
    ScheduleEvent,
)


def get_or_create_user(username, full_name, role, password, trainer_id=None, needs_q=False):
    u = User.query.filter_by(username=username).first()
    if u:
        return u, False
    u = User(
        username=username, full_name=full_name, role=role,
        trainer_id=trainer_id, needs_questionnaire=needs_q,
    )
    u.set_password(password)
    db.session.add(u)
    db.session.flush()
    return u, True


def seed_logic():
    """Idempotent seeding logic. Caller must be inside an app context."""
    db.create_all()

    admin, _ = get_or_create_user("admin", "Администратор", "admin", "admin123")
    ruslan, _ = get_or_create_user("ruslan", "Руслан Орынбаев", "trainer", "ruslan123")
    demo, _ = get_or_create_user("demo", "Демо Клиент", "client", "demo123",
                                 trainer_id=ruslan.id, needs_q=False)
    new_cli, _ = get_or_create_user("newclient", "Новый Клиент", "client", "new123",
                                    trainer_id=ruslan.id, needs_q=True)

    # ---- Settings (landing) ----
    defaults = {
        "hero_title": "RONI FITNESS",
        "hero_subtitle": "Персональные программы. Доказуемый результат.",
        "trainer_name": "Руслан Орынбаев",
        "trainer_tagline": "Сертифицированный тренер · 8+ лет опыта",
        "trainer_bio": (
            "Я помогаю клиентам менять тело и образ жизни — без шаблонных программ. "
            "Каждый план составляется индивидуально: сила, рельеф, восстановление, питание. "
            "Работаю и онлайн, и в зале. Главное — результат и дисциплина."
        ),
        "trainer_phone": "+7 (777) 000-00-00",
        "trainer_email": "roni@fitness.kz",
        "trainer_instagram": "@roni.fitness",
        "achievements": (
            "8+ лет в персональном тренинге\n"
            "200+ клиентов с подтверждённым прогрессом\n"
            "Сертификат FPA, NSCA-CPT\n"
            "Специализация: набор массы, жиросжигание, реабилитация"
        ),
    }
    for k, v in defaults.items():
        s = db.session.get(Setting, k)
        if s is None:
            db.session.add(Setting(key=k, value=v))

    # ---- Gallery: link the 25 trainer photos ----
    if GalleryPhoto.query.count() == 0:
        trainer_dir = Path(__file__).resolve().parent / "static" / "trainer"
        if trainer_dir.exists():
            files = sorted([p.name for p in trainer_dir.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp")])
            for idx, fname in enumerate(files):
                db.session.add(GalleryPhoto(
                    file_url=f"/api/public/trainer-photo/{fname}",
                    caption=None,
                    order_index=idx,
                    is_featured=(idx < 3),
                ))

    # ---- Demo questionnaire ----
    if not Questionnaire.query.filter_by(client_id=demo.id).first():
        db.session.add(Questionnaire(
            client_id=demo.id,
            birth_year=1995, gender="male", height_cm=180, weight_kg=88,
            target_weight_kg=80, experience="intermediate",
            goals="Сбросить 8 кг, подтянуть пресс, увеличить силу в жиме",
            injuries="Иногда болит правое плечо после жима",
            diseases="нет",
            allergies="нет",
            diet_preferences="не ем рыбу, люблю мясо и творог",
            available_days="mon,wed,fri",
            available_time="19:00",
            equipment="зал полный",
            sleep_hours=7, water_l=2.5,
            motivation="Хочу выглядеть лучше к лету и чувствовать себя бодрее",
            notes="Готов тренироваться 3 раза в неделю",
        ))

    # ---- Exercise library for trainer Ruslan ----
    if Exercise.query.filter_by(trainer_id=ruslan.id).count() == 0:
        seed_ex = [
            ("Приседания со штангой", "Ноги", "Базовое упражнение на квадрицепсы и ягодицы",
             "Спина прямая, колени по направлению носков, опуститесь до параллели бедра с полом.",
             "youtube", "https://www.youtube.com/watch?v=ultWZbUMPL8"),
            ("Жим лёжа", "Грудь", "Развитие грудных, передней дельты, трицепса",
             "Лопатки сведены, гриф опускается на середину груди, локти под углом ~45°.",
             "youtube", "https://www.youtube.com/watch?v=rT7DgCr-3pg"),
            ("Становая тяга", "Спина", "Базовое движение на заднюю цепь",
             "Гриф касается ног, спина прямая, тяга начинается с ног.",
             "youtube", "https://www.youtube.com/watch?v=op9kVnSso6Q"),
            ("Тяга вертикального блока", "Спина", "Широчайшие мышцы спины",
             "Локти вниз, грудь подаём вперёд, лопатки сводим.",
             "youtube", "https://www.youtube.com/watch?v=CAwf7n6Luuc"),
            ("Подъём гантелей на бицепс", "Руки", "Бицепс",
             "Локти зафиксированы, без раскачки корпуса.", "none", None),
            ("Жим гантелей сидя", "Плечи", "Средняя дельта, передняя дельта",
             "Спина прижата, локти не до конца разгибаем.", "none", None),
            ("Скручивания", "Пресс", "Прямая мышца живота",
             "Поясницу прижимаем к полу, движение коротким амплитудой.", "none", None),
            ("Планка", "Кор", "Стабилизация кора",
             "Тело в одну линию, таз не проваливать.", "none", None),
            ("Выпады с гантелями", "Ноги", "Квадрицепс, ягодицы",
             "Шаг широкий, колено передней ноги над голеностопом.", "none", None),
            ("Кардио — беговая дорожка", "Кардио", "Восстановление, жиросжигание",
             "20–30 минут пульс 130–150.", "none", None),
        ]
        for n, mg, p, instr, kind, url in seed_ex:
            db.session.add(Exercise(
                trainer_id=ruslan.id, name=n, muscle_group=mg, purpose=p,
                instructions=instr, media_kind=kind, media_url=url,
            ))
        db.session.flush()

    # ---- Demo workout plan ----
    if not WorkoutPlan.query.filter_by(client_id=demo.id, is_active=True).first():
        plan = WorkoutPlan(client_id=demo.id, trainer_id=ruslan.id,
                           name="Тренировочный сплит 3×",
                           description="Понедельник — низ, среда — верх (тяга), пятница — верх (жим).",
                           is_active=True)
        db.session.add(plan)
        db.session.flush()

        ex_by_name = {e.name: e for e in Exercise.query.filter_by(trainer_id=ruslan.id).all()}

        days_setup = [
            (0, "19:00", "Ноги + пресс", [
                ("Приседания со штангой", 4, "8-10", 120, 80),
                ("Выпады с гантелями", 3, "12", 90, 18),
                ("Скручивания", 3, "20", 45, None),
                ("Планка", 3, "60 сек", 60, None),
            ]),
            (2, "19:00", "Спина + бицепс", [
                ("Становая тяга", 4, "5", 150, 100),
                ("Тяга вертикального блока", 4, "10", 90, 60),
                ("Подъём гантелей на бицепс", 3, "12", 60, 14),
                ("Кардио — беговая дорожка", 1, "20 мин", 0, None),
            ]),
            (4, "19:00", "Грудь + плечи", [
                ("Жим лёжа", 4, "6-8", 120, 80),
                ("Жим гантелей сидя", 4, "10", 90, 20),
                ("Скручивания", 3, "20", 45, None),
            ]),
        ]
        for dow, t, title, items in days_setup:
            day = WorkoutDay(plan_id=plan.id, day_of_week=dow, time_of_day=t, title=title)
            db.session.add(day)
            db.session.flush()
            for idx, (n, sets, reps, rest, w) in enumerate(items):
                ex = ex_by_name.get(n)
                if ex:
                    db.session.add(WorkoutItem(
                        day_id=day.id, exercise_id=ex.id,
                        sets=sets, reps=reps, rest_sec=rest, weight_kg=w,
                        order_index=idx,
                    ))

    # ---- Demo nutrition plan ----
    if not NutritionPlan.query.filter_by(client_id=demo.id, is_active=True).first():
        np_ = NutritionPlan(client_id=demo.id, trainer_id=ruslan.id,
                            name="Дефицит 500 ккал",
                            description="Цель — снижение веса. БЖУ распределено на 4 приёма пищи.",
                            target_kcal=2200, protein_g=180, carbs_g=220, fat_g=70,
                            is_active=True)
        db.session.add(np_)
        db.session.flush()
        meals = [
            (None, "breakfast", "08:00", "Овсянка + яйца", "60 г овсянки на воде, 3 яйца, ягоды", 480, 35, 55, 12),
            (None, "lunch", "13:00", "Курица + рис + овощи", "180 г куриной грудки, 80 г риса, овощной салат", 620, 55, 70, 12),
            (None, "snack", "16:30", "Творог + орехи", "200 г творога 5%, 20 г миндаля", 380, 35, 12, 18),
            (None, "dinner", "20:00", "Лосось + гречка", "180 г лосося, 70 г гречки, зелень", 640, 45, 60, 22),
        ]
        for idx, (dow, mt, tm, name, desc, kcal, p, c, f) in enumerate(meals):
            db.session.add(Meal(
                plan_id=np_.id, day_of_week=dow, meal_type=mt, time_of_day=tm,
                name=name, description=desc, kcal=kcal, protein=p, carbs=c, fat=f,
                order_index=idx,
            ))

    # ---- Demo measurements ----
    if Measurement.query.filter_by(client_id=demo.id).count() == 0:
        base = datetime.utcnow() - timedelta(days=90)
        samples = [
            (0, 91.0, 22.0), (15, 90.0, 21.5), (30, 88.5, 21.0),
            (45, 87.5, 20.5), (60, 86.0, 20.0), (90, 84.8, 19.4),
        ]
        for off, w, bf in samples:
            db.session.add(Measurement(
                client_id=demo.id,
                weight_kg=w, body_fat_pct=bf,
                chest=104, waist=92 - (90 - off) / 20, hips=102, biceps=37, thighs=62, calves=39,
                taken_at=base + timedelta(days=off),
            ))

    # ---- Demo finance: monthly fees ----
    if demo.monthly_fee is None:
        demo.monthly_fee = 80000
        demo.currency = "₸"
    if new_cli.monthly_fee is None:
        new_cli.monthly_fee = 80000
        new_cli.currency = "₸"

    # ---- Demo schedule slots ----
    if ScheduleEvent.query.filter_by(trainer_id=ruslan.id).count() == 0:
        for dow, time, title, cid, kind in [
            (0, "19:00", "Демо · Ноги", demo.id, "training"),
            (2, "19:00", "Демо · Спина", demo.id, "training"),
            (4, "19:00", "Демо · Грудь", demo.id, "training"),
            (5, "10:00", "Открытый слот", None, "block"),
        ]:
            db.session.add(ScheduleEvent(
                trainer_id=ruslan.id, client_id=cid, title=title, kind=kind,
                day_of_week=dow, start_time=time, duration_min=60, location="Зал FitArena",
            ))

    db.session.commit()


def seed():
    from app import app
    with app.app_context():
        seed_logic()
        print("✓ seed complete")
        print("  admin / admin123     (super admin)")
        print("  ruslan / ruslan123   (trainer)")
        print("  demo / demo123       (client with full plan)")
        print("  newclient / new123   (client — needs to fill questionnaire)")


if __name__ == "__main__":
    seed()
