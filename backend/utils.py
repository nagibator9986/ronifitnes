import re
import secrets
from functools import wraps
from pathlib import Path

from flask import current_app, jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from werkzeug.utils import secure_filename

_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "қ": "k", "ғ": "g", "ә": "a", "і": "i", "ң": "n", "ү": "u", "ұ": "u", "ө": "o",
}


def slugify(text: str) -> str:
    text = (text or "").lower().strip()
    text = "".join(_TRANSLIT.get(ch, ch) for ch in text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or secrets.token_hex(4)


def unique_slug(model, text: str, current_id=None) -> str:
    base = slugify(text)
    slug, n = base, 2
    while True:
        q = model.query.filter_by(slug=slug)
        if current_id is not None:
            q = q.filter(model.id != current_id)
        if q.first() is None:
            return slug
        slug = f"{base}-{n}"
        n += 1


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Недостаточно прав"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def save_upload(file_storage, subdir: str) -> str:
    """Сохраняет картинку в UPLOAD_DIR/<subdir>/ и возвращает публичный URL."""
    filename = secure_filename(file_storage.filename or "")
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in current_app.config["ALLOWED_IMAGE_EXT"]:
        raise ValueError("Недопустимый формат файла. Разрешены: png, jpg, webp, gif, svg")
    target_dir = Path(current_app.config["UPLOAD_DIR"]) / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_hex(8)}.{ext}"
    file_storage.save(target_dir / name)
    return f"/uploads/{subdir}/{name}"
