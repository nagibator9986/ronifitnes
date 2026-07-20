from flask import Blueprint, jsonify, request

from extensions import db
from models import ContactMessage, Partner, Project, Service, Setting

bp = Blueprint("public", __name__, url_prefix="/api/public")


@bp.get("/landing")
def landing():
    services = (
        Service.query.filter_by(is_active=True)
        .order_by(Service.order_index, Service.id)
        .all()
    )
    projects = Project.query.order_by(Project.order_index, Project.id).all()
    partners = Partner.query.order_by(Partner.order_index, Partner.id).all()
    return jsonify(
        {
            "settings": Setting.get_all(),
            "services": [s.to_dict() for s in services],
            "projects": [p.to_dict() for p in projects],
            "partners": [p.to_dict() for p in partners],
        }
    )


@bp.post("/contact")
def contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not message:
        return jsonify({"error": "Укажите имя и опишите задачу"}), 400
    if not email and not phone:
        return jsonify({"error": "Оставьте email или телефон для связи"}), 400
    if len(message) > 5000:
        return jsonify({"error": "Сообщение слишком длинное"}), 400

    db.session.add(
        ContactMessage(
            name=name[:160],
            email=email[:200],
            phone=phone[:60],
            company=(data.get("company") or "").strip()[:200],
            message=message,
        )
    )
    db.session.commit()
    return jsonify({"ok": True, "message": "Спасибо! Мы свяжемся с вами в ближайшее время."})
