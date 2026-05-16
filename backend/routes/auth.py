from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from extensions import db
from models import User, Questionnaire

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter(db.func.lower(User.username) == username).first()
    if not user or not user.check_password(password) or not user.is_active:
        return jsonify({"error": "Неверный логин или пароль"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()})


@bp.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = db.session.get(User, int(uid))
    if not user:
        return jsonify({"error": "not found"}), 404

    out = user.to_dict()
    if user.role == "client":
        q = Questionnaire.query.filter_by(client_id=user.id).first()
        out["has_questionnaire"] = q is not None
    return jsonify(out)


@bp.post("/change-password")
@jwt_required()
def change_password():
    uid = get_jwt_identity()
    user = db.session.get(User, int(uid))
    data = request.get_json(silent=True) or {}
    old = data.get("old_password") or ""
    new = data.get("new_password") or ""
    if len(new) < 4:
        return jsonify({"error": "Пароль слишком короткий"}), 400
    if not user.check_password(old):
        return jsonify({"error": "Неверный текущий пароль"}), 401
    user.set_password(new)
    db.session.commit()
    return jsonify({"ok": True})
