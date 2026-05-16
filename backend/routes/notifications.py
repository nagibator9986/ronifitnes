from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from extensions import db
from models import Notification
from utils import current_user

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.get("")
@jwt_required()
def list_notifications():
    user = current_user()
    items = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc()).limit(50).all()
    unread = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({
        "items": [n.to_dict() for n in items],
        "unread": unread,
    })


@bp.post("/<int:nid>/read")
@jwt_required()
def mark_read(nid):
    user = current_user()
    n = Notification.query.filter_by(id=nid, user_id=user.id).first_or_404()
    n.is_read = True
    db.session.commit()
    return jsonify({"ok": True})


@bp.post("/read-all")
@jwt_required()
def read_all():
    user = current_user()
    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"ok": True})
