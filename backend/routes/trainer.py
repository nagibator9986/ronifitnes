import json
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app

from extensions import db
from models import (
    User, Questionnaire, Exercise, WorkoutPlan, WorkoutDay, WorkoutItem,
    NutritionPlan, Meal, ProgressPhoto, Measurement, Message, WorkoutLog,
    TrainerNote, PlanTemplate,
)
from utils import role_required, generate_username, generate_password, save_upload, allowed_image, notify

bp = Blueprint("trainer", __name__, url_prefix="/api/trainer")


# ---------- OVERVIEW DASHBOARD ----------

@bp.get("/overview")
@role_required("trainer", "admin")
def overview(user):
    q = User.query.filter_by(role="client")
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    clients = q.all()
    client_ids = [c.id for c in clients]

    # Pending: clients who submitted questionnaire but have no plan yet
    pending_q = []
    no_plan = []
    inactive = []
    week_ago = datetime.utcnow() - timedelta(days=7)
    for c in clients:
        qn = Questionnaire.query.filter_by(client_id=c.id).first()
        plan = WorkoutPlan.query.filter_by(client_id=c.id, is_active=True).first()
        last_log = WorkoutLog.query.filter_by(client_id=c.id).order_by(WorkoutLog.completed_at.desc()).first()
        if qn and not plan:
            no_plan.append({"client": c.to_dict(), "submitted_at": qn.submitted_at.isoformat()})
        if c.needs_questionnaire:
            pending_q.append(c.to_dict())
        if plan and (not last_log or last_log.completed_at < week_ago):
            inactive.append({"client": c.to_dict(), "last_log": last_log.completed_at.isoformat() if last_log else None})

    # Recent activity (last 20 events: workouts done, photos, measurements)
    activity = []
    if client_ids:
        for l in WorkoutLog.query.filter(WorkoutLog.client_id.in_(client_ids)).order_by(WorkoutLog.completed_at.desc()).limit(10):
            client = next((x for x in clients if x.id == l.client_id), None)
            activity.append({
                "type": "workout",
                "client_id": l.client_id,
                "client_name": client.full_name if client else "",
                "at": l.completed_at.isoformat(),
                "label": f"завершил тренировку",
            })
        for p in ProgressPhoto.query.filter(ProgressPhoto.client_id.in_(client_ids)).order_by(ProgressPhoto.taken_at.desc()).limit(10):
            client = next((x for x in clients if x.id == p.client_id), None)
            activity.append({
                "type": "photo",
                "client_id": p.client_id,
                "client_name": client.full_name if client else "",
                "at": p.taken_at.isoformat(),
                "label": f"загрузил фото ({p.period_label})",
            })
    activity.sort(key=lambda x: x["at"], reverse=True)

    return jsonify({
        "totals": {
            "clients": len(clients),
            "active": sum(1 for c in clients if c.is_active),
            "pending_questionnaire": len(pending_q),
            "no_plan": len(no_plan),
            "inactive_week": len(inactive),
            "exercises": Exercise.query.filter_by(trainer_id=user.id).count() if user.role == "trainer" else Exercise.query.count(),
        },
        "pending_questionnaire": pending_q,
        "no_plan": no_plan,
        "inactive": inactive,
        "activity": activity[:15],
    })


# ---------- TRAINER NOTES ----------

@bp.get("/clients/<int:cid>/notes")
@role_required("trainer", "admin")
def list_notes(user, cid):
    notes = TrainerNote.query.filter_by(client_id=cid, trainer_id=user.id).order_by(TrainerNote.pinned.desc(), TrainerNote.created_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@bp.post("/clients/<int:cid>/notes")
@role_required("trainer", "admin")
def add_note(user, cid):
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "empty"}), 400
    n = TrainerNote(trainer_id=user.id, client_id=cid, content=content, pinned=bool(data.get("pinned")))
    db.session.add(n)
    db.session.commit()
    return jsonify(n.to_dict()), 201


@bp.patch("/notes/<int:nid>")
@role_required("trainer", "admin")
def update_note(user, nid):
    n = TrainerNote.query.get_or_404(nid)
    if n.trainer_id != user.id and user.role != "admin":
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    if "content" in data:
        n.content = data["content"]
    if "pinned" in data:
        n.pinned = bool(data["pinned"])
    db.session.commit()
    return jsonify(n.to_dict())


@bp.delete("/notes/<int:nid>")
@role_required("trainer", "admin")
def del_note(user, nid):
    n = TrainerNote.query.get_or_404(nid)
    if n.trainer_id != user.id and user.role != "admin":
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(n)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- PLAN TEMPLATES ----------

@bp.get("/templates")
@role_required("trainer", "admin")
def list_templates(user):
    q = PlanTemplate.query
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    kind = request.args.get("kind")
    if kind:
        q = q.filter_by(kind=kind)
    items = q.order_by(PlanTemplate.created_at.desc()).all()
    return jsonify([t.to_dict() for t in items])


@bp.post("/templates")
@role_required("trainer", "admin")
def create_template(user):
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name required"}), 400
    t = PlanTemplate(
        trainer_id=user.id,
        name=name,
        description=data.get("description"),
        kind=data.get("kind") or "workout",
        data_json=json.dumps(data.get("data") or {}, ensure_ascii=False),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


@bp.delete("/templates/<int:tid>")
@role_required("trainer", "admin")
def del_template(user, tid):
    t = PlanTemplate.query.get_or_404(tid)
    if t.trainer_id != user.id and user.role != "admin":
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(t)
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/templates/from-plan/<int:plan_id>")
@role_required("trainer", "admin")
def template_from_plan(user, plan_id):
    plan = WorkoutPlan.query.get_or_404(plan_id)
    if user.role == "trainer" and plan.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or plan.name).strip()
    payload = {
        "name": plan.name,
        "description": plan.description,
        "days": [{
            "day_of_week": d.day_of_week,
            "time_of_day": d.time_of_day,
            "title": d.title,
            "notes": d.notes,
            "items": [{
                "exercise_id": it.exercise_id,
                "sets": it.sets, "reps": it.reps,
                "rest_sec": it.rest_sec, "weight_kg": it.weight_kg,
                "notes": it.notes,
            } for it in d.items],
        } for d in plan.days],
    }
    t = PlanTemplate(trainer_id=user.id, name=name, description=plan.description,
                     kind="workout", data_json=json.dumps(payload, ensure_ascii=False))
    db.session.add(t)
    db.session.commit()
    return jsonify(t.to_dict()), 201


# ---------- CLIENTS ----------

@bp.get("/clients")
@role_required("trainer", "admin")
def list_clients(user):
    q = User.query.filter_by(role="client")
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    clients = q.order_by(User.created_at.desc()).all()
    return jsonify([c.to_dict() for c in clients])


@bp.post("/clients")
@role_required("trainer", "admin")
def create_client(user):
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    if not full_name:
        return jsonify({"error": "Имя обязательно"}), 400

    username = (data.get("username") or "").strip().lower()
    if not username:
        username = generate_username(full_name, lambda u: User.query.filter(db.func.lower(User.username) == u).first() is not None)
    if User.query.filter(db.func.lower(User.username) == username).first():
        return jsonify({"error": "Логин уже занят"}), 400

    password = data.get("password") or generate_password()

    trainer_id = user.id if user.role == "trainer" else (data.get("trainer_id") or user.id)
    client = User(
        username=username,
        role="client",
        full_name=full_name,
        email=data.get("email"),
        phone=data.get("phone"),
        trainer_id=trainer_id,
        needs_questionnaire=bool(data.get("needs_questionnaire", True)),
    )
    client.set_password(password)
    db.session.add(client)
    db.session.commit()
    out = client.to_dict()
    out["password"] = password
    return jsonify(out), 201


def _ensure_owns_client(user, client_id):
    client = User.query.get_or_404(client_id)
    if client.role != "client":
        return None, (jsonify({"error": "not a client"}), 400)
    if user.role == "trainer" and client.trainer_id != user.id:
        return None, (jsonify({"error": "forbidden"}), 403)
    return client, None


@bp.get("/clients/<int:cid>")
@role_required("trainer", "admin")
def client_detail(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    q = Questionnaire.query.filter_by(client_id=client.id).first()
    workout = WorkoutPlan.query.filter_by(client_id=client.id, is_active=True).first()
    nutrition = NutritionPlan.query.filter_by(client_id=client.id, is_active=True).first()
    return jsonify({
        "client": client.to_dict(),
        "questionnaire": q.to_dict() if q else None,
        "workout_plan": workout.to_dict() if workout else None,
        "nutrition_plan": nutrition.to_dict() if nutrition else None,
        "progress_photos": [p.to_dict() for p in ProgressPhoto.query.filter_by(client_id=client.id).order_by(ProgressPhoto.taken_at.desc()).all()],
        "measurements": [m.to_dict() for m in Measurement.query.filter_by(client_id=client.id).order_by(Measurement.taken_at.desc()).all()],
        "logs": [l.to_dict() for l in WorkoutLog.query.filter_by(client_id=client.id).order_by(WorkoutLog.completed_at.desc()).limit(30).all()],
    })


@bp.patch("/clients/<int:cid>")
@role_required("trainer", "admin")
def update_client(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    for f in ("full_name", "email", "phone"):
        if f in data:
            setattr(client, f, data[f])
    if "needs_questionnaire" in data:
        client.needs_questionnaire = bool(data["needs_questionnaire"])
    if "is_active" in data:
        client.is_active = bool(data["is_active"])
    if data.get("new_password"):
        client.set_password(data["new_password"])
    db.session.commit()
    return jsonify(client.to_dict())


@bp.post("/clients/<int:cid>/reset-password")
@role_required("trainer", "admin")
def reset_password(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    pwd = generate_password()
    client.set_password(pwd)
    db.session.commit()
    return jsonify({"password": pwd})


@bp.delete("/clients/<int:cid>")
@role_required("trainer", "admin")
def delete_client(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    db.session.delete(client)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- EXERCISE LIBRARY ----------

@bp.get("/exercises")
@role_required("trainer", "admin")
def list_exercises(user):
    q = Exercise.query
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    return jsonify([e.to_dict() for e in q.order_by(Exercise.name.asc()).all()])


@bp.post("/exercises")
@role_required("trainer", "admin")
def create_exercise(user):
    data = request.form if request.form else (request.get_json(silent=True) or {})
    file = request.files.get("file")

    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Название обязательно"}), 400

    media_kind = data.get("media_kind") or "none"
    media_url = data.get("media_url") or None
    if file and allowed_image(file.filename):
        fname = save_upload(file, current_app.config["EXERCISE_FOLDER"], prefix="ex_")
        media_url = f"/api/public/upload/exercises/{fname}"
        media_kind = "gif" if fname.lower().endswith(".gif") else "image"

    ex = Exercise(
        trainer_id=user.id if user.role == "trainer" else (data.get("trainer_id") or user.id),
        name=name,
        muscle_group=data.get("muscle_group"),
        purpose=data.get("purpose"),
        instructions=data.get("instructions"),
        media_kind=media_kind,
        media_url=media_url,
    )
    db.session.add(ex)
    db.session.commit()
    return jsonify(ex.to_dict()), 201


@bp.patch("/exercises/<int:eid>")
@role_required("trainer", "admin")
def update_exercise(user, eid):
    ex = Exercise.query.get_or_404(eid)
    if user.role == "trainer" and ex.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    for f in ("name", "muscle_group", "purpose", "instructions", "media_kind", "media_url"):
        if f in data:
            setattr(ex, f, data[f])
    db.session.commit()
    return jsonify(ex.to_dict())


@bp.delete("/exercises/<int:eid>")
@role_required("trainer", "admin")
def delete_exercise(user, eid):
    ex = Exercise.query.get_or_404(eid)
    if user.role == "trainer" and ex.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(ex)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- WORKOUT PLANS ----------

@bp.post("/clients/<int:cid>/workout-plan")
@role_required("trainer", "admin")
def create_workout_plan(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    # deactivate existing
    WorkoutPlan.query.filter_by(client_id=cid, is_active=True).update({"is_active": False})

    plan = WorkoutPlan(
        client_id=cid,
        trainer_id=user.id if user.role == "trainer" else (client.trainer_id or user.id),
        name=data.get("name") or "Программа тренировок",
        description=data.get("description"),
        is_active=True,
    )
    db.session.add(plan)
    db.session.flush()
    notify(cid, "plan", "Тренер обновил вашу программу тренировок", plan.name, "/app/plan")

    for d in (data.get("days") or []):
        day = WorkoutDay(
            plan_id=plan.id,
            day_of_week=int(d.get("day_of_week", 0)),
            time_of_day=d.get("time_of_day"),
            title=d.get("title"),
            notes=d.get("notes"),
        )
        db.session.add(day)
        db.session.flush()
        for idx, it in enumerate(d.get("items") or []):
            db.session.add(WorkoutItem(
                day_id=day.id,
                exercise_id=int(it["exercise_id"]),
                sets=int(it.get("sets") or 3),
                reps=str(it.get("reps") or "10"),
                rest_sec=int(it.get("rest_sec") or 60),
                weight_kg=it.get("weight_kg"),
                notes=it.get("notes"),
                order_index=idx,
            ))
    db.session.commit()
    return jsonify(plan.to_dict()), 201


@bp.patch("/workout-plans/<int:pid>")
@role_required("trainer", "admin")
def update_workout_plan(user, pid):
    plan = WorkoutPlan.query.get_or_404(pid)
    if user.role == "trainer" and plan.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}

    if "name" in data:
        plan.name = data["name"]
    if "description" in data:
        plan.description = data["description"]
    if "is_active" in data:
        plan.is_active = bool(data["is_active"])

    if "days" in data:
        # full replace of days
        for d in plan.days:
            db.session.delete(d)
        db.session.flush()
        for d in data["days"]:
            day = WorkoutDay(
                plan_id=plan.id,
                day_of_week=int(d.get("day_of_week", 0)),
                time_of_day=d.get("time_of_day"),
                title=d.get("title"),
                notes=d.get("notes"),
            )
            db.session.add(day)
            db.session.flush()
            for idx, it in enumerate(d.get("items") or []):
                db.session.add(WorkoutItem(
                    day_id=day.id,
                    exercise_id=int(it["exercise_id"]),
                    sets=int(it.get("sets") or 3),
                    reps=str(it.get("reps") or "10"),
                    rest_sec=int(it.get("rest_sec") or 60),
                    weight_kg=it.get("weight_kg"),
                    notes=it.get("notes"),
                    order_index=idx,
                ))
    db.session.commit()
    return jsonify(plan.to_dict())


@bp.delete("/workout-plans/<int:pid>")
@role_required("trainer", "admin")
def delete_workout_plan(user, pid):
    plan = WorkoutPlan.query.get_or_404(pid)
    if user.role == "trainer" and plan.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(plan)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- NUTRITION PLANS ----------

@bp.post("/clients/<int:cid>/nutrition-plan")
@role_required("trainer", "admin")
def create_nutrition_plan(user, cid):
    client, err = _ensure_owns_client(user, cid)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    NutritionPlan.query.filter_by(client_id=cid, is_active=True).update({"is_active": False})

    plan = NutritionPlan(
        client_id=cid,
        trainer_id=user.id if user.role == "trainer" else (client.trainer_id or user.id),
        name=data.get("name") or "План питания",
        description=data.get("description"),
        target_kcal=data.get("target_kcal"),
        protein_g=data.get("protein_g"),
        carbs_g=data.get("carbs_g"),
        fat_g=data.get("fat_g"),
        is_active=True,
    )
    db.session.add(plan)
    db.session.flush()
    notify(cid, "plan", "Тренер обновил ваш план питания", plan.name, "/app/plan")
    for idx, m in enumerate(data.get("meals") or []):
        db.session.add(Meal(
            plan_id=plan.id,
            day_of_week=m.get("day_of_week"),
            meal_type=m.get("meal_type"),
            time_of_day=m.get("time_of_day"),
            name=m.get("name"),
            description=m.get("description"),
            kcal=m.get("kcal"),
            protein=m.get("protein"),
            carbs=m.get("carbs"),
            fat=m.get("fat"),
            order_index=idx,
        ))
    db.session.commit()
    return jsonify(plan.to_dict()), 201


@bp.patch("/nutrition-plans/<int:pid>")
@role_required("trainer", "admin")
def update_nutrition_plan(user, pid):
    plan = NutritionPlan.query.get_or_404(pid)
    if user.role == "trainer" and plan.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    for f in ("name", "description", "target_kcal", "protein_g", "carbs_g", "fat_g"):
        if f in data:
            setattr(plan, f, data[f])
    if "is_active" in data:
        plan.is_active = bool(data["is_active"])
    if "meals" in data:
        for m in plan.meals:
            db.session.delete(m)
        db.session.flush()
        for idx, m in enumerate(data["meals"]):
            db.session.add(Meal(
                plan_id=plan.id,
                day_of_week=m.get("day_of_week"),
                meal_type=m.get("meal_type"),
                time_of_day=m.get("time_of_day"),
                name=m.get("name"),
                description=m.get("description"),
                kcal=m.get("kcal"),
                protein=m.get("protein"),
                carbs=m.get("carbs"),
                fat=m.get("fat"),
                order_index=idx,
            ))
    db.session.commit()
    return jsonify(plan.to_dict())


@bp.delete("/nutrition-plans/<int:pid>")
@role_required("trainer", "admin")
def delete_nutrition_plan(user, pid):
    plan = NutritionPlan.query.get_or_404(pid)
    if user.role == "trainer" and plan.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(plan)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- MESSAGES ----------

@bp.get("/messages/<int:other_id>")
@role_required("trainer", "admin", "client")
def thread(user, other_id):
    msgs = Message.query.filter(
        ((Message.sender_id == user.id) & (Message.receiver_id == other_id)) |
        ((Message.sender_id == other_id) & (Message.receiver_id == user.id))
    ).order_by(Message.sent_at.asc()).all()
    # mark received as read
    for m in msgs:
        if m.receiver_id == user.id and not m.is_read:
            m.is_read = True
    db.session.commit()
    return jsonify([m.to_dict() for m in msgs])


@bp.post("/messages/<int:other_id>")
@role_required("trainer", "admin", "client")
def send_message(user, other_id):
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"error": "пусто"}), 400
    other = User.query.get_or_404(other_id)
    msg = Message(sender_id=user.id, receiver_id=other.id, content=content)
    db.session.add(msg)
    notify(other.id, "message", f"Новое сообщение от {user.full_name}", content[:120], "/app/chat")
    db.session.commit()
    return jsonify(msg.to_dict()), 201
