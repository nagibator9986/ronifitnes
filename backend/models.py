from datetime import datetime, timezone

import bcrypt

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(160), default="")
    role = db.Column(db.String(20), default="admin")  # only admins for now
    created_at = db.Column(db.DateTime, default=utcnow)

    def set_password(self, raw: str) -> None:
        self.password_hash = bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()

    def check_password(self, raw: str) -> bool:
        try:
            return bcrypt.checkpw(raw.encode(), self.password_hash.encode())
        except ValueError:
            return False

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
        }


class Service(db.Model):
    """AI-услуга компании (карточка в секции «Услуги»)."""

    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    icon = db.Column(db.String(40), default="spark")  # ключ SVG-иконки на фронте
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, default="")
    features = db.Column(db.Text, default="")  # пункты, по одному в строке
    order_index = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "icon": self.icon,
            "title": self.title,
            "description": self.description,
            "features": [f.strip() for f in (self.features or "").splitlines() if f.strip()],
            "features_raw": self.features or "",
            "order_index": self.order_index,
            "is_active": self.is_active,
        }


class Project(db.Model):
    """Кейс в секции «Наши проекты»."""

    __tablename__ = "projects"

    CATEGORIES = ("chatbot", "agent", "ml", "vision", "automation", "analytics")

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    slug = db.Column(db.String(180), unique=True, nullable=False, index=True)
    category = db.Column(db.String(40), default="chatbot")
    client = db.Column(db.String(160), default="")  # для кого сделан проект
    tagline = db.Column(db.String(260), default="")  # короткое описание для карточки
    description = db.Column(db.Text, default="")  # подробное описание (модалка)
    tech_stack = db.Column(db.String(400), default="")  # через запятую
    metrics = db.Column(db.Text, default="")  # строки вида "значение|подпись"
    image_url = db.Column(db.String(400), default="")
    link = db.Column(db.String(400), default="")
    is_featured = db.Column(db.Boolean, default=False)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        metrics = []
        for line in (self.metrics or "").splitlines():
            if "|" in line:
                value, label = line.split("|", 1)
                metrics.append({"value": value.strip(), "label": label.strip()})
        return {
            "id": self.id,
            "title": self.title,
            "slug": self.slug,
            "category": self.category,
            "client": self.client,
            "tagline": self.tagline,
            "description": self.description,
            "tech_stack": [t.strip() for t in (self.tech_stack or "").split(",") if t.strip()],
            "tech_stack_raw": self.tech_stack or "",
            "metrics": metrics,
            "metrics_raw": self.metrics or "",
            "image_url": self.image_url,
            "link": self.link,
            "is_featured": self.is_featured,
            "order_index": self.order_index,
        }


class Partner(db.Model):
    """Компания-партнёр (секция «С кем мы работаем»)."""

    __tablename__ = "partners"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    logo_url = db.Column(db.String(400), default="")
    website = db.Column(db.String(400), default="")
    description = db.Column(db.String(300), default="")
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "logo_url": self.logo_url,
            "website": self.website,
            "description": self.description,
            "order_index": self.order_index,
        }


class ContactMessage(db.Model):
    """Заявка из формы «Обсудить проект»."""

    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(200), default="")
    phone = db.Column(db.String(60), default="")
    company = db.Column(db.String(200), default="")
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Setting(db.Model):
    """Ключ-значение: тексты лендинга, контакты, блок команды."""

    __tablename__ = "settings"

    key = db.Column(db.String(80), primary_key=True)
    value = db.Column(db.Text, default="")

    @staticmethod
    def get_all() -> dict:
        return {s.key: s.value for s in Setting.query.all()}

    @staticmethod
    def set(key: str, value: str) -> None:
        row = db.session.get(Setting, key)
        if row is None:
            db.session.add(Setting(key=key, value=value))
        else:
            row.value = value
