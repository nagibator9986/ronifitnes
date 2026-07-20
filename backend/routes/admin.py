from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from extensions import db
from models import ContactMessage, Partner, Project, Service, Setting, User
from utils import role_required, save_upload, unique_slug

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ---------------------------------------------------------------- overview

@bp.get("/overview")
@role_required("admin")
def overview():
    latest = (
        ContactMessage.query.order_by(ContactMessage.created_at.desc()).limit(5).all()
    )
    return jsonify(
        {
            "projects": Project.query.count(),
            "partners": Partner.query.count(),
            "services": Service.query.count(),
            "messages": ContactMessage.query.count(),
            "unread_messages": ContactMessage.query.filter_by(is_read=False).count(),
            "latest_messages": [m.to_dict() for m in latest],
        }
    )


# ---------------------------------------------------------------- projects

@bp.get("/projects")
@role_required("admin")
def list_projects():
    rows = Project.query.order_by(Project.order_index, Project.id).all()
    return jsonify({"items": [p.to_dict() for p in rows]})


def _apply_project(p: Project, data: dict) -> None:
    p.title = (data.get("title") or p.title or "").strip()
    p.category = data.get("category") or p.category
    p.client = (data.get("client") or "").strip()
    p.tagline = (data.get("tagline") or "").strip()
    p.description = data.get("description") or ""
    p.tech_stack = data.get("tech_stack_raw", data.get("tech_stack", p.tech_stack)) or ""
    p.metrics = data.get("metrics_raw", data.get("metrics", p.metrics)) or ""
    p.image_url = (data.get("image_url") or "").strip()
    p.link = (data.get("link") or "").strip()
    p.is_featured = bool(data.get("is_featured"))
    p.order_index = int(data.get("order_index") or 0)


@bp.post("/projects")
@role_required("admin")
def create_project():
    data = request.get_json(silent=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"error": "Укажите название проекта"}), 400
    p = Project(slug=unique_slug(Project, data["title"]))
    _apply_project(p, data)
    db.session.add(p)
    db.session.commit()
    return jsonify({"item": p.to_dict()}), 201


@bp.put("/projects/<int:pid>")
@role_required("admin")
def update_project(pid):
    p = db.session.get(Project, pid)
    if p is None:
        return jsonify({"error": "Проект не найден"}), 404
    data = request.get_json(silent=True) or {}
    _apply_project(p, data)
    if data.get("title"):
        p.slug = unique_slug(Project, data["title"], current_id=p.id)
    db.session.commit()
    return jsonify({"item": p.to_dict()})


@bp.delete("/projects/<int:pid>")
@role_required("admin")
def delete_project(pid):
    p = db.session.get(Project, pid)
    if p is None:
        return jsonify({"error": "Проект не найден"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- partners

@bp.get("/partners")
@role_required("admin")
def list_partners():
    rows = Partner.query.order_by(Partner.order_index, Partner.id).all()
    return jsonify({"items": [p.to_dict() for p in rows]})


def _apply_partner(p: Partner, data: dict) -> None:
    p.name = (data.get("name") or p.name or "").strip()
    p.logo_url = (data.get("logo_url") or "").strip()
    p.website = (data.get("website") or "").strip()
    p.description = (data.get("description") or "").strip()
    p.order_index = int(data.get("order_index") or 0)


@bp.post("/partners")
@role_required("admin")
def create_partner():
    data = request.get_json(silent=True) or {}
    if not (data.get("name") or "").strip():
        return jsonify({"error": "Укажите название компании"}), 400
    p = Partner()
    _apply_partner(p, data)
    db.session.add(p)
    db.session.commit()
    return jsonify({"item": p.to_dict()}), 201


@bp.put("/partners/<int:pid>")
@role_required("admin")
def update_partner(pid):
    p = db.session.get(Partner, pid)
    if p is None:
        return jsonify({"error": "Партнёр не найден"}), 404
    _apply_partner(p, request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify({"item": p.to_dict()})


@bp.delete("/partners/<int:pid>")
@role_required("admin")
def delete_partner(pid):
    p = db.session.get(Partner, pid)
    if p is None:
        return jsonify({"error": "Партнёр не найден"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- services

@bp.get("/services")
@role_required("admin")
def list_services():
    rows = Service.query.order_by(Service.order_index, Service.id).all()
    return jsonify({"items": [s.to_dict() for s in rows]})


def _apply_service(s: Service, data: dict) -> None:
    s.title = (data.get("title") or s.title or "").strip()
    s.icon = (data.get("icon") or "spark").strip()
    s.description = data.get("description") or ""
    s.features = data.get("features_raw", data.get("features", s.features)) or ""
    s.order_index = int(data.get("order_index") or 0)
    s.is_active = bool(data.get("is_active", True))


@bp.post("/services")
@role_required("admin")
def create_service():
    data = request.get_json(silent=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"error": "Укажите название услуги"}), 400
    s = Service()
    _apply_service(s, data)
    db.session.add(s)
    db.session.commit()
    return jsonify({"item": s.to_dict()}), 201


@bp.put("/services/<int:sid>")
@role_required("admin")
def update_service(sid):
    s = db.session.get(Service, sid)
    if s is None:
        return jsonify({"error": "Услуга не найдена"}), 404
    _apply_service(s, request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify({"item": s.to_dict()})


@bp.delete("/services/<int:sid>")
@role_required("admin")
def delete_service(sid):
    s = db.session.get(Service, sid)
    if s is None:
        return jsonify({"error": "Услуга не найдена"}), 404
    db.session.delete(s)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- messages

@bp.get("/messages")
@role_required("admin")
def list_messages():
    rows = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify({"items": [m.to_dict() for m in rows]})


@bp.put("/messages/<int:mid>/read")
@role_required("admin")
def toggle_read(mid):
    m = db.session.get(ContactMessage, mid)
    if m is None:
        return jsonify({"error": "Заявка не найдена"}), 404
    m.is_read = not m.is_read
    db.session.commit()
    return jsonify({"item": m.to_dict()})


@bp.delete("/messages/<int:mid>")
@role_required("admin")
def delete_message(mid):
    m = db.session.get(ContactMessage, mid)
    if m is None:
        return jsonify({"error": "Заявка не найдена"}), 404
    db.session.delete(m)
    db.session.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- settings

@bp.get("/settings")
@role_required("admin")
def get_settings():
    return jsonify({"settings": Setting.get_all()})


@bp.put("/settings")
@role_required("admin")
def update_settings():
    data = request.get_json(silent=True) or {}
    for key, value in data.items():
        if isinstance(key, str) and len(key) <= 80:
            Setting.set(key, str(value if value is not None else ""))
    db.session.commit()
    return jsonify({"settings": Setting.get_all()})


# ---------------------------------------------------------------- misc

@bp.post("/upload")
@role_required("admin")
def upload():
    file = request.files.get("file")
    if file is None or not file.filename:
        return jsonify({"error": "Файл не передан"}), 400
    kind = request.form.get("kind", "misc")
    if kind not in {"projects", "partners", "founder", "misc"}:
        kind = "misc"
    try:
        url = save_upload(file, kind)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"url": url})


@bp.put("/password")
@role_required("admin")
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("current") or ""
    new = data.get("new") or ""
    if len(new) < 6:
        return jsonify({"error": "Новый пароль должен быть не короче 6 символов"}), 400
    user = db.session.get(User, int(get_jwt_identity()))
    if user is None or not user.check_password(current):
        return jsonify({"error": "Текущий пароль неверен"}), 400
    user.set_password(new)
    db.session.commit()
    return jsonify({"ok": True})
