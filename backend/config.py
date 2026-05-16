import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def _normalize_db_url(url: str) -> str:
    # Railway/Heroku give postgres:// but SQLAlchemy 2 needs postgresql+psycopg://
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        # psycopg2-binary is in requirements; default driver is psycopg2
        pass
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "roni-fitness-dev-secret-change-me")

    _db_url = os.environ.get("DATABASE_URL")
    if _db_url:
        SQLALCHEMY_DATABASE_URI = _normalize_db_url(_db_url)
    else:
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{BASE_DIR / 'ronifitness.db'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET", os.environ.get("SECRET_KEY", "roni-jwt-dev-secret"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]

    UPLOAD_FOLDER = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))
    AVATAR_FOLDER = UPLOAD_FOLDER / "avatars"
    PROGRESS_FOLDER = UPLOAD_FOLDER / "progress"
    EXERCISE_FOLDER = UPLOAD_FOLDER / "exercises"
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25 MB

    ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "gif", "webp"}

    TRAINER_GALLERY_DIR = BASE_DIR / "static" / "trainer"

    # frontend build directory (vite default: frontend/dist relative to repo root)
    FRONTEND_DIST = Path(os.environ.get("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist"))

    ENV = os.environ.get("FLASK_ENV", "development")
    IS_PROD = ENV == "production"

    for d in (UPLOAD_FOLDER, AVATAR_FOLDER, PROGRESS_FOLDER, EXERCISE_FOLDER):
        d.mkdir(parents=True, exist_ok=True)
