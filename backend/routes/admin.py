from flask import Blueprint, request, jsonify, current_app

from extensions import db
from models import User, GalleryPhoto, Setting
from utils import role_required, generate_username, generate_password, save_upload, allowed_image

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------- USERS ----------

@bp.get("/users")
@role_required("admin")
def list_users(_):
    role = request.args.get("role")
    q = User.query
    if role:
        q = q.filter_by(role=role)
    users = q.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@bp.post("/users")
@role_required("admin")
def create_user(_):
    data = request.get_json(silent=True) or {}
    role = (data.get("role") or "client").lower()
    if role not in {"admin", "trainer", "client"}:
        return jsonify({"error": "invalid role"}), 400

    full_name = (data.get("full_name") or "").strip()
    if not full_name:
        return jsonify({"error": "Имя обязательно"}), 400

    username = (data.get("username") or "").strip().lower()
    if not username:
        username = generate_username(full_name, lambda u: User.query.filter(db.func.lower(User.username) == u).first() is not None)

    password = data.get("password") or generate_password()
    trainer_id = data.get("trainer_id")

    if User.query.filter(db.func.lower(User.username) == username.lower()).first():
        return jsonify({"error": "Такой логин уже занят"}), 400

    user = User(
        username=username,
        role=role,
        full_name=full_name,
        email=data.get("email"),
        phone=data.get("phone"),
        trainer_id=trainer_id if role == "client" else None,
        needs_questionnaire=bool(data.get("needs_questionnaire")) if role == "client" else False,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    out = user.to_dict()
    out["password"] = password  # plaintext only at creation time
    return jsonify(out), 201


@bp.patch("/users/<int:uid>")
@role_required("admin")
def update_user(_, uid):
    user = User.query.get_or_404(uid)
    data = request.get_json(silent=True) or {}
    for field in ("full_name", "email", "phone", "trainer_id"):
        if field in data:
            setattr(user, field, data[field])
    if "is_active" in data:
        user.is_active = bool(data["is_active"])
    if "needs_questionnaire" in data and user.role == "client":
        user.needs_questionnaire = bool(data["needs_questionnaire"])
    if data.get("new_password"):
        user.set_password(data["new_password"])
    db.session.commit()
    return jsonify(user.to_dict())


@bp.delete("/users/<int:uid>")
@role_required("admin")
def delete_user(_, uid):
    user = User.query.get_or_404(uid)
    if user.role == "admin":
        return jsonify({"error": "Нельзя удалить администратора"}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- LANDING / GALLERY ----------

@bp.get("/gallery")
@role_required("admin")
def list_gallery(_):
    photos = GalleryPhoto.query.order_by(GalleryPhoto.order_index.asc()).all()
    return jsonify([p.to_dict() for p in photos])


@bp.post("/gallery")
@role_required("admin")
def add_gallery(_):
    file = request.files.get("file")
    if not file or not allowed_image(file.filename):
        return jsonify({"error": "Нужно изображение"}), 400
    fname = save_upload(file, current_app.config["AVATAR_FOLDER"], prefix="gal_")
    photo = GalleryPhoto(
        file_url=f"/api/public/upload/avatars/{fname}",
        caption=request.form.get("caption"),
        order_index=int(request.form.get("order_index") or 0),
    )
    db.session.add(photo)
    db.session.commit()
    return jsonify(photo.to_dict()), 201


@bp.delete("/gallery/<int:pid>")
@role_required("admin")
def delete_gallery(_, pid):
    p = GalleryPhoto.query.get_or_404(pid)
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


# ---------- SETTINGS ----------

@bp.get("/settings")
@role_required("admin")
def list_settings(_):
    items = Setting.query.all()
    return jsonify({s.key: s.value for s in items})


@bp.put("/settings")
@role_required("admin")
def update_settings(_):
    data = request.get_json(silent=True) or {}
    for k, v in data.items():
        s = db.session.get(Setting, k)
        if s is None:
            s = Setting(key=k, value=v)
            db.session.add(s)
        else:
            s.value = v
    db.session.commit()
    return jsonify({"ok": True})


# ---------- DASHBOARD STATS ----------

@bp.get("/stats")
@role_required("admin")
def stats(_):
    from models import WorkoutLog, ProgressPhoto, Exercise
    from datetime import datetime, timedelta

    week_ago = datetime.utcnow() - timedelta(days=7)
    return jsonify({
        "trainers": User.query.filter_by(role="trainer").count(),
        "clients": User.query.filter_by(role="client").count(),
        "active_clients": User.query.filter_by(role="client", is_active=True).count(),
        "exercises": Exercise.query.count(),
        "workouts_week": WorkoutLog.query.filter(WorkoutLog.completed_at >= week_ago).count(),
        "photos_total": ProgressPhoto.query.count(),
    })


@bp.get("/trainers-detail")
@role_required("admin")
def trainers_detail(_):
    from models import Exercise, WorkoutPlan
    trainers = User.query.filter_by(role="trainer").all()
    out = []
    for t in trainers:
        clients = User.query.filter_by(trainer_id=t.id, role="client").count()
        exercises = Exercise.query.filter_by(trainer_id=t.id).count()
        plans = WorkoutPlan.query.filter_by(trainer_id=t.id, is_active=True).count()
        out.append({
            **t.to_dict(),
            "clients": clients,
            "exercises": exercises,
            "active_plans": plans,
        })
    return jsonify(out)


@bp.get("/activity")
@role_required("admin")
def activity(_):
    from models import WorkoutLog, ProgressPhoto, Questionnaire
    feed = []
    for l in WorkoutLog.query.order_by(WorkoutLog.completed_at.desc()).limit(20):
        u = db.session.get(User,l.client_id)
        feed.append({"type": "workout", "at": l.completed_at.isoformat(), "user": u.full_name if u else "", "label": "тренировка выполнена"})
    for p in ProgressPhoto.query.order_by(ProgressPhoto.taken_at.desc()).limit(20):
        u = db.session.get(User,p.client_id)
        feed.append({"type": "photo", "at": p.taken_at.isoformat(), "user": u.full_name if u else "", "label": f"фото прогресса ({p.period_label})"})
    for q in Questionnaire.query.order_by(Questionnaire.submitted_at.desc()).limit(20):
        u = db.session.get(User,q.client_id)
        feed.append({"type": "questionnaire", "at": q.submitted_at.isoformat(), "user": u.full_name if u else "", "label": "анкета отправлена"})
    feed.sort(key=lambda x: x["at"], reverse=True)
    return jsonify(feed[:40])
