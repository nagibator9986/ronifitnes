import re
import random
import string
from functools import wraps
from pathlib import Path
from flask import jsonify, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename

from models import User


CYR2LAT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "",
    "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def translit(text: str) -> str:
    out = []
    for ch in (text or "").lower():
        if ch in CYR2LAT:
            out.append(CYR2LAT[ch])
        elif ch.isalnum():
            out.append(ch)
        else:
            out.append("")
    return "".join(out)


def generate_username(full_name: str, taken_check) -> str:
    base = translit(full_name).replace(" ", "")
    if not base:
        base = "client"
    base = base[:14]
    for _ in range(20):
        suffix = "".join(random.choices(string.digits, k=3))
        candidate = f"{base}{suffix}"
        if not taken_check(candidate):
            return candidate
    # last resort
    return f"{base}{random.randint(1000, 9999)}"


def generate_password(length: int = 6) -> str:
    # easy-to-read: no l, 1, O, 0
    alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
    return "".join(random.choices(alphabet, k=length))


def role_required(*roles):
    from extensions import db
    def wrapper(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            verify_jwt_in_request()
            uid = get_jwt_identity()
            user = db.session.get(User, int(uid)) if uid is not None else None
            if user is None or not user.is_active:
                return jsonify({"error": "unauthorized"}), 401
            if roles and user.role not in roles:
                return jsonify({"error": "forbidden"}), 403
            return fn(user, *args, **kwargs)
        return inner
    return wrapper


def current_user():
    from extensions import db
    uid = get_jwt_identity()
    return db.session.get(User, int(uid)) if uid is not None else None


def allowed_image(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in current_app.config["ALLOWED_IMAGE_EXT"]


def save_upload(file_storage, target_dir: Path, prefix: str = "") -> str:
    target_dir.mkdir(parents=True, exist_ok=True)
    safe = secure_filename(file_storage.filename or "file")
    if not safe:
        safe = "file"
    rnd = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    name = f"{prefix}{rnd}_{safe}"
    path = target_dir / name
    file_storage.save(path)
    return name


def notify(user_id: int, kind: str, title: str, body: str = "", link: str = ""):
    from extensions import db
    from models import Notification
    n = Notification(user_id=user_id, kind=kind, title=title, body=body or None, link=link or None)
    db.session.add(n)
    return n


def youtube_id(url: str) -> str | None:
    if not url:
        return None
    patterns = [
        r"(?:v=|/embed/|/v/|youtu\.be/)([A-Za-z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None
