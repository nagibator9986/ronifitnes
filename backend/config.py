import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv(BASE_DIR / ".env")


def _database_uri() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        return f"sqlite:///{BASE_DIR / 'illuminartai.db'}"
    # Railway/Heroku style URLs use the deprecated postgres:// scheme
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    ENV = os.environ.get("FLASK_ENV", "development")
    IS_PROD = ENV == "production"

    ALLOWED_ORIGINS = [
        o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()
    ]

    UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))
    MAX_CONTENT_LENGTH = 8 * 1024 * 1024  # 8 MB per upload
    ALLOWED_IMAGE_EXT = {"png", "jpg", "jpeg", "webp", "gif", "svg"}

    FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
