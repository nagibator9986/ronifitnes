from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta

from extensions import db
from models import (
    User, Questionnaire, WorkoutPlan, NutritionPlan,
    ProgressPhoto, Measurement, WorkoutLog, SetLog,
)
from utils import role_required, save_upload, allowed_image, notify

bp = Blueprint("client", __name__, url_prefix="/api/client")


# ---------- QUESTIONNAIRE ----------

@bp.get("/questionnaire")
@role_required("client")
def get_q(user):
    q = Questionnaire.query.filter_by(client_id=user.id).first()
    return jsonify(q.to_dict() if q else None)


@bp.post("/questionnaire")
@role_required("client")
def submit_q(user):
    data = request.get_json(silent=True) or {}
    q = Questionnaire.query.filter_by(client_id=user.id).first()
    if q is None:
        q = Questionnaire(client_id=user.id)
        db.session.add(q)

    fields = [
        "birth_year", "gender", "height_cm", "weight_kg", "target_weight_kg",
        "experience", "goals", "injuries", "diseases", "allergies",
        "diet_preferences", "available_days", "available_time", "equipment",
        "sleep_hours", "water_l", "motivation", "notes",
    ]
    for f in fields:
        if f in data:
            setattr(q, f, data[f])
    q.submitted_at = datetime.utcnow()

    user.needs_questionnaire = False
    if user.trainer_id:
        notify(user.trainer_id, "questionnaire",
               f"{user.full_name} заполнил(а) анкету",
               (q.goals or "")[:120], f"/trainer/clients/{user.id}")
    db.session.commit()
    return jsonify(q.to_dict())


# ---------- DASHBOARD ----------

@bp.get("/dashboard")
@role_required("client")
def dashboard(user):
    today_dow = datetime.utcnow().weekday()
    workout = WorkoutPlan.query.filter_by(client_id=user.id, is_active=True).first()
    nutrition = NutritionPlan.query.filter_by(client_id=user.id, is_active=True).first()
    trainer = db.session.get(User, user.trainer_id) if user.trainer_id else None
    last_log = WorkoutLog.query.filter_by(client_id=user.id).order_by(WorkoutLog.completed_at.desc()).first()
    last_meas = Measurement.query.filter_by(client_id=user.id).order_by(Measurement.taken_at.desc()).first()

    today_workout = None
    if workout:
        for d in workout.days:
            if d.day_of_week == today_dow:
                today_workout = d.to_dict()
                break

    today_meals = []
    if nutrition:
        for m in nutrition.meals:
            if m.day_of_week is None or m.day_of_week == today_dow:
                today_meals.append(m.to_dict())

    return jsonify({
        "trainer": trainer.to_dict(include_email=False) if trainer else None,
        "workout_plan": workout.to_dict() if workout else None,
        "nutrition_plan": nutrition.to_dict() if nutrition else None,
        "today_workout": today_workout,
        "today_meals": today_meals,
        "last_log": last_log.to_dict() if last_log else None,
        "last_measurement": last_meas.to_dict() if last_meas else None,
        "logs_count": WorkoutLog.query.filter_by(client_id=user.id).count(),
        "photos_count": ProgressPhoto.query.filter_by(client_id=user.id).count(),
    })


# ---------- WORKOUT LOGS ----------

@bp.post("/logs")
@role_required("client")
def log_workout(user):
    data = request.get_json(silent=True) or {}
    sets = data.get("set_logs") or []
    log = WorkoutLog(
        client_id=user.id,
        day_id=data.get("day_id"),
        duration_min=data.get("duration_min"),
        mood=data.get("mood"),
        notes=data.get("notes"),
    )
    db.session.add(log)
    db.session.flush()

    total_volume = 0.0
    for s in sets:
        reps = int(s.get("reps") or 0)
        weight = float(s.get("weight_kg") or 0)
        sl = SetLog(
            log_id=log.id,
            exercise_id=s.get("exercise_id"),
            set_index=int(s.get("set_index") or 0),
            reps=reps,
            weight_kg=weight,
            rpe=s.get("rpe"),
        )
        db.session.add(sl)
        total_volume += reps * weight
    log.total_volume_kg = total_volume

    # notify trainer
    if user.trainer_id:
        notify(user.trainer_id, "workout_done",
               f"{user.full_name} завершил(а) тренировку",
               f"Объём: {total_volume:.0f} кг" if total_volume else "",
               f"/trainer/clients/{user.id}")
    db.session.commit()
    return jsonify(log.to_dict(with_sets=True)), 201


@bp.get("/logs/<int:lid>")
@role_required("client")
def get_log(user, lid):
    log = WorkoutLog.query.filter_by(id=lid, client_id=user.id).first_or_404()
    return jsonify(log.to_dict(with_sets=True))


# ---------- CALENDAR ----------

@bp.get("/calendar")
@role_required("client")
def calendar(user):
    """Return weeks worth of workout days and completion status."""
    today = datetime.utcnow().date()
    monday = today - timedelta(days=today.weekday())
    plan = WorkoutPlan.query.filter_by(client_id=user.id, is_active=True).first()
    logs = WorkoutLog.query.filter(
        WorkoutLog.client_id == user.id,
        WorkoutLog.completed_at >= datetime.combine(monday - timedelta(days=14), datetime.min.time())
    ).all()

    weeks = []
    for w in range(-1, 3):  # last week + 3 future weeks
        week_start = monday + timedelta(weeks=w)
        days = []
        for d in range(7):
            date_ = week_start + timedelta(days=d)
            workout = None
            if plan:
                for wd in plan.days:
                    if wd.day_of_week == d:
                        workout = wd.to_dict()
                        break
            completed = any(
                l.completed_at.date() == date_ and (workout is None or l.day_id == workout["id"])
                for l in logs
            )
            days.append({
                "date": date_.isoformat(),
                "day_of_week": d,
                "is_today": date_ == today,
                "is_past": date_ < today,
                "workout": workout,
                "completed": completed,
            })
        weeks.append({"start": week_start.isoformat(), "days": days})
    return jsonify({"weeks": weeks, "plan_id": plan.id if plan else None})


# ---------- WORKOUT PLAYER SESSION ----------

@bp.get("/workout-player/<int:day_id>")
@role_required("client")
def player_session(user, day_id):
    from models import WorkoutDay, WorkoutPlan
    day = WorkoutDay.query.get_or_404(day_id)
    plan = WorkoutPlan.query.get_or_404(day.plan_id)
    if plan.client_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    # find previous best per exercise (best 1-rep weight)
    items = []
    for it in day.items:
        prev = (db.session.query(SetLog)
                .join(WorkoutLog, SetLog.log_id == WorkoutLog.id)
                .filter(WorkoutLog.client_id == user.id,
                        SetLog.exercise_id == it.exercise_id,
                        SetLog.weight_kg.isnot(None))
                .order_by(SetLog.weight_kg.desc())
                .first())
        items.append({
            "item": it.to_dict(),
            "previous_best": {"weight_kg": prev.weight_kg, "reps": prev.reps} if prev else None,
        })
    return jsonify({
        "day": day.to_dict(),
        "items": items,
    })


# ---------- ACHIEVEMENTS ----------

@bp.get("/achievements")
@role_required("client")
def achievements(user):
    logs = WorkoutLog.query.filter_by(client_id=user.id).all()
    photos = ProgressPhoto.query.filter_by(client_id=user.id).count()
    meas = Measurement.query.filter_by(client_id=user.id).order_by(Measurement.taken_at.asc()).all()
    total_vol = sum((l.total_volume_kg or 0) for l in logs)
    log_count = len(logs)

    # streak of consecutive days with a workout
    if logs:
        dates = sorted({l.completed_at.date() for l in logs}, reverse=True)
        streak = 1
        from datetime import timedelta as TD
        cursor = dates[0]
        for d in dates[1:]:
            if (cursor - d).days <= 2:  # tolerate weekly gaps
                streak += 1
                cursor = d
            else:
                break
    else:
        streak = 0

    weight_change = None
    if len(meas) >= 2 and meas[0].weight_kg and meas[-1].weight_kg:
        weight_change = round(meas[-1].weight_kg - meas[0].weight_kg, 1)

    defs = [
        {"key": "first_workout", "title": "Первая тренировка", "icon": "🎯", "earned": log_count >= 1, "progress": min(1, log_count)},
        {"key": "ten_workouts", "title": "10 тренировок", "icon": "🔥", "earned": log_count >= 10, "progress": min(log_count, 10) / 10},
        {"key": "fifty_workouts", "title": "50 тренировок", "icon": "💪", "earned": log_count >= 50, "progress": min(log_count, 50) / 50},
        {"key": "hundred_workouts", "title": "100 тренировок", "icon": "🏆", "earned": log_count >= 100, "progress": min(log_count, 100) / 100},
        {"key": "first_photo", "title": "Первое фото", "icon": "📸", "earned": photos >= 1, "progress": min(1, photos)},
        {"key": "photo_journey", "title": "Фото-журнал 12 шт", "icon": "🖼️", "earned": photos >= 12, "progress": min(photos, 12) / 12},
        {"key": "volume_10t", "title": "10 тонн поднято", "icon": "🚀", "earned": total_vol >= 10000, "progress": min(total_vol, 10000) / 10000},
        {"key": "volume_50t", "title": "50 тонн поднято", "icon": "🛸", "earned": total_vol >= 50000, "progress": min(total_vol, 50000) / 50000},
        {"key": "first_measure", "title": "Первый замер", "icon": "📏", "earned": len(meas) >= 1, "progress": min(1, len(meas))},
        {"key": "ten_measures", "title": "10 замеров", "icon": "📊", "earned": len(meas) >= 10, "progress": min(len(meas), 10) / 10},
    ]

    return jsonify({
        "achievements": defs,
        "stats": {
            "workouts": log_count,
            "total_volume_kg": round(total_vol, 1),
            "photos": photos,
            "measurements": len(meas),
            "streak": streak,
            "weight_change_kg": weight_change,
        },
    })


@bp.get("/logs")
@role_required("client")
def list_logs(user):
    logs = WorkoutLog.query.filter_by(client_id=user.id).order_by(WorkoutLog.completed_at.desc()).limit(60).all()
    return jsonify([l.to_dict() for l in logs])


# ---------- PROGRESS PHOTOS ----------

@bp.get("/photos")
@role_required("client")
def list_photos(user):
    photos = ProgressPhoto.query.filter_by(client_id=user.id).order_by(ProgressPhoto.taken_at.desc()).all()
    return jsonify([p.to_dict() for p in photos])


@bp.post("/photos")
@role_required("client")
def upload_photo(user):
    file = request.files.get("file")
    if not file or not allowed_image(file.filename):
        return jsonify({"error": "Нужно изображение"}), 400
    fname = save_upload(file, current_app.config["PROGRESS_FOLDER"], prefix=f"u{user.id}_")
    p = ProgressPhoto(
        client_id=user.id,
        period_label=request.form.get("period_label") or "custom",
        custom_label=request.form.get("custom_label"),
        pose=request.form.get("pose") or "front",
        file_url=f"/api/public/upload/progress/{fname}",
        notes=request.form.get("notes"),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@bp.delete("/photos/<int:pid>")
@role_required("client")
def delete_photo(user, pid):
    p = ProgressPhoto.query.get_or_404(pid)
    if p.client_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- MEASUREMENTS ----------

@bp.get("/measurements")
@role_required("client")
def list_meas(user):
    ms = Measurement.query.filter_by(client_id=user.id).order_by(Measurement.taken_at.asc()).all()
    return jsonify([m.to_dict() for m in ms])


@bp.post("/measurements")
@role_required("client")
def add_meas(user):
    data = request.get_json(silent=True) or {}
    m = Measurement(
        client_id=user.id,
        weight_kg=data.get("weight_kg"),
        body_fat_pct=data.get("body_fat_pct"),
        chest=data.get("chest"),
        waist=data.get("waist"),
        hips=data.get("hips"),
        biceps=data.get("biceps"),
        thighs=data.get("thighs"),
        calves=data.get("calves"),
        notes=data.get("notes"),
    )
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@bp.delete("/measurements/<int:mid>")
@role_required("client")
def del_meas(user, mid):
    m = Measurement.query.get_or_404(mid)
    if m.client_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(m)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- PLAN VIEW ----------

@bp.get("/plan")
@role_required("client")
def plan(user):
    workout = WorkoutPlan.query.filter_by(client_id=user.id, is_active=True).first()
    nutrition = NutritionPlan.query.filter_by(client_id=user.id, is_active=True).first()
    return jsonify({
        "workout": workout.to_dict() if workout else None,
        "nutrition": nutrition.to_dict() if nutrition else None,
    })
