from flask import Blueprint, jsonify, send_from_directory, current_app
from pathlib import Path

from models import GalleryPhoto, Setting, User

bp = Blueprint("public", __name__, url_prefix="/api/public")


@bp.get("/landing")
def landing():
    photos = GalleryPhoto.query.order_by(GalleryPhoto.order_index.asc()).all()
    settings = {s.key: s.value for s in Setting.query.all()}
    trainer = User.query.filter_by(role="trainer").first()
    return jsonify({
        "trainer": {
            "full_name": trainer.full_name if trainer else "Ruslan",
            "avatar_url": trainer.avatar_url if trainer else None,
        },
        "gallery": [p.to_dict() for p in photos],
        "settings": settings,
    })


@bp.get("/trainer-photo/<path:filename>")
def trainer_photo(filename):
    return send_from_directory(current_app.config["TRAINER_GALLERY_DIR"], filename)


@bp.get("/upload/<kind>/<path:filename>")
def upload(kind, filename):
    folder_map = {
        "avatars": current_app.config["AVATAR_FOLDER"],
        "progress": current_app.config["PROGRESS_FOLDER"],
        "exercises": current_app.config["EXERCISE_FOLDER"],
    }
    folder = folder_map.get(kind)
    if not folder:
        return "not found", 404
    return send_from_directory(folder, filename)
