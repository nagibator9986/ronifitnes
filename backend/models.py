from datetime import datetime, date
import bcrypt
from extensions import db


def _now():
    return datetime.utcnow()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin | trainer | client

    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(40))
    avatar_url = db.Column(db.String(255))

    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    needs_questionnaire = db.Column(db.Boolean, default=False, nullable=False)

    # finance — only meaningful for clients (price per month)
    monthly_fee = db.Column(db.Integer)  # in trainer's currency, no fractions
    currency = db.Column(db.String(8), default="₸")

    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    trainer = db.relationship("User", remote_side=[id], backref="clients")

    def set_password(self, raw: str):
        self.password_hash = bcrypt.hashpw(raw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    def check_password(self, raw: str) -> bool:
        try:
            return bcrypt.checkpw(raw.encode("utf-8"), self.password_hash.encode("utf-8"))
        except Exception:
            return False

    def to_dict(self, include_email=True):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "email": self.email if include_email else None,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "trainer_id": self.trainer_id,
            "is_active": self.is_active,
            "needs_questionnaire": self.needs_questionnaire,
            "monthly_fee": self.monthly_fee,
            "currency": self.currency or "₸",
            "created_at": self.created_at.isoformat(),
        }


class Questionnaire(db.Model):
    __tablename__ = "questionnaires"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    birth_year = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    height_cm = db.Column(db.Float)
    weight_kg = db.Column(db.Float)
    target_weight_kg = db.Column(db.Float)
    experience = db.Column(db.String(40))  # beginner / intermediate / advanced
    goals = db.Column(db.Text)
    injuries = db.Column(db.Text)
    diseases = db.Column(db.Text)
    allergies = db.Column(db.Text)
    diet_preferences = db.Column(db.Text)
    available_days = db.Column(db.String(60))  # CSV like "mon,wed,fri"
    available_time = db.Column(db.String(30))  # "morning" / "evening" / free text
    equipment = db.Column(db.String(60))  # "gym" / "home" / "minimal"
    sleep_hours = db.Column(db.Float)
    water_l = db.Column(db.Float)
    motivation = db.Column(db.Text)
    notes = db.Column(db.Text)

    submitted_at = db.Column(db.DateTime, default=_now, nullable=False)

    client = db.relationship("User", backref=db.backref("questionnaire", uselist=False, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "birth_year": self.birth_year,
            "gender": self.gender,
            "height_cm": self.height_cm,
            "weight_kg": self.weight_kg,
            "target_weight_kg": self.target_weight_kg,
            "experience": self.experience,
            "goals": self.goals,
            "injuries": self.injuries,
            "diseases": self.diseases,
            "allergies": self.allergies,
            "diet_preferences": self.diet_preferences,
            "available_days": self.available_days,
            "available_time": self.available_time,
            "equipment": self.equipment,
            "sleep_hours": self.sleep_hours,
            "water_l": self.water_l,
            "motivation": self.motivation,
            "notes": self.notes,
            "submitted_at": self.submitted_at.isoformat(),
        }


class Exercise(db.Model):
    __tablename__ = "exercises"
    id = db.Column(db.Integer, primary_key=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    muscle_group = db.Column(db.String(60))
    purpose = db.Column(db.Text)
    instructions = db.Column(db.Text)
    media_kind = db.Column(db.String(20), default="none")  # image | gif | youtube | none
    media_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "trainer_id": self.trainer_id,
            "name": self.name,
            "muscle_group": self.muscle_group,
            "purpose": self.purpose,
            "instructions": self.instructions,
            "media_kind": self.media_kind,
            "media_url": self.media_url,
            "created_at": self.created_at.isoformat(),
        }


class WorkoutPlan(db.Model):
    __tablename__ = "workout_plans"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, default=date.today)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    days = db.relationship("WorkoutDay", backref="plan", cascade="all, delete-orphan", order_by="WorkoutDay.day_of_week")

    def to_dict(self, with_days=True):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "trainer_id": self.trainer_id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "days": [d.to_dict() for d in self.days] if with_days else [],
        }


class WorkoutDay(db.Model):
    __tablename__ = "workout_days"
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("workout_plans.id", ondelete="CASCADE"), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Mon
    time_of_day = db.Column(db.String(5))  # HH:MM
    title = db.Column(db.String(120))
    notes = db.Column(db.Text)

    items = db.relationship("WorkoutItem", backref="day", cascade="all, delete-orphan", order_by="WorkoutItem.order_index")

    def to_dict(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "day_of_week": self.day_of_week,
            "time_of_day": self.time_of_day,
            "title": self.title,
            "notes": self.notes,
            "items": [i.to_dict() for i in self.items],
        }


class WorkoutItem(db.Model):
    __tablename__ = "workout_items"
    id = db.Column(db.Integer, primary_key=True)
    day_id = db.Column(db.Integer, db.ForeignKey("workout_days.id", ondelete="CASCADE"), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id"), nullable=False)
    sets = db.Column(db.Integer, default=3)
    reps = db.Column(db.String(30), default="10")
    rest_sec = db.Column(db.Integer, default=60)
    weight_kg = db.Column(db.Float)
    notes = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)

    exercise = db.relationship("Exercise")

    def to_dict(self):
        return {
            "id": self.id,
            "day_id": self.day_id,
            "exercise_id": self.exercise_id,
            "sets": self.sets,
            "reps": self.reps,
            "rest_sec": self.rest_sec,
            "weight_kg": self.weight_kg,
            "notes": self.notes,
            "order_index": self.order_index,
            "exercise": self.exercise.to_dict() if self.exercise else None,
        }


class NutritionPlan(db.Model):
    __tablename__ = "nutrition_plans"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    target_kcal = db.Column(db.Integer)
    protein_g = db.Column(db.Integer)
    carbs_g = db.Column(db.Integer)
    fat_g = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    meals = db.relationship("Meal", backref="plan", cascade="all, delete-orphan", order_by="Meal.order_index")

    def to_dict(self, with_meals=True):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "trainer_id": self.trainer_id,
            "name": self.name,
            "description": self.description,
            "target_kcal": self.target_kcal,
            "protein_g": self.protein_g,
            "carbs_g": self.carbs_g,
            "fat_g": self.fat_g,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "meals": [m.to_dict() for m in self.meals] if with_meals else [],
        }


class Meal(db.Model):
    __tablename__ = "meals"
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("nutrition_plans.id", ondelete="CASCADE"), nullable=False)
    day_of_week = db.Column(db.Integer)  # 0..6 or NULL for every day
    meal_type = db.Column(db.String(20))  # breakfast/lunch/dinner/snack
    time_of_day = db.Column(db.String(5))
    name = db.Column(db.String(120))
    description = db.Column(db.Text)
    kcal = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "day_of_week": self.day_of_week,
            "meal_type": self.meal_type,
            "time_of_day": self.time_of_day,
            "name": self.name,
            "description": self.description,
            "kcal": self.kcal,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
            "order_index": self.order_index,
        }


class ProgressPhoto(db.Model):
    __tablename__ = "progress_photos"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    period_label = db.Column(db.String(40), nullable=False)  # before | 1m | 3m | 6m | 1y | custom
    custom_label = db.Column(db.String(60))
    pose = db.Column(db.String(20), default="front")  # front/side/back
    file_url = db.Column(db.String(500), nullable=False)
    notes = db.Column(db.Text)
    taken_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "period_label": self.period_label,
            "custom_label": self.custom_label,
            "pose": self.pose,
            "file_url": self.file_url,
            "notes": self.notes,
            "taken_at": self.taken_at.isoformat(),
        }


class Measurement(db.Model):
    __tablename__ = "measurements"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    weight_kg = db.Column(db.Float)
    body_fat_pct = db.Column(db.Float)
    chest = db.Column(db.Float)
    waist = db.Column(db.Float)
    hips = db.Column(db.Float)
    biceps = db.Column(db.Float)
    thighs = db.Column(db.Float)
    calves = db.Column(db.Float)
    notes = db.Column(db.Text)
    taken_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "weight_kg": self.weight_kg,
            "body_fat_pct": self.body_fat_pct,
            "chest": self.chest,
            "waist": self.waist,
            "hips": self.hips,
            "biceps": self.biceps,
            "thighs": self.thighs,
            "calves": self.calves,
            "notes": self.notes,
            "taken_at": self.taken_at.isoformat(),
        }


class WorkoutLog(db.Model):
    __tablename__ = "workout_logs"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day_id = db.Column(db.Integer, db.ForeignKey("workout_days.id"))
    completed_at = db.Column(db.DateTime, default=_now, nullable=False)
    duration_min = db.Column(db.Integer)
    mood = db.Column(db.Integer)  # 1..5
    notes = db.Column(db.Text)
    total_volume_kg = db.Column(db.Float, default=0)  # sum(sets * reps * weight) for this session

    set_logs = db.relationship("SetLog", backref="log", cascade="all, delete-orphan")

    def to_dict(self, with_sets=False):
        out = {
            "id": self.id,
            "client_id": self.client_id,
            "day_id": self.day_id,
            "completed_at": self.completed_at.isoformat(),
            "duration_min": self.duration_min,
            "mood": self.mood,
            "notes": self.notes,
            "total_volume_kg": self.total_volume_kg or 0,
        }
        if with_sets:
            out["set_logs"] = [s.to_dict() for s in self.set_logs]
        return out


class SetLog(db.Model):
    """Detailed per-set log inside a WorkoutLog."""
    __tablename__ = "set_logs"
    id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey("workout_logs.id", ondelete="CASCADE"), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey("exercises.id"))
    set_index = db.Column(db.Integer, default=0)
    reps = db.Column(db.Integer)
    weight_kg = db.Column(db.Float)
    rpe = db.Column(db.Integer)  # rate of perceived exertion 1..10

    def to_dict(self):
        return {
            "id": self.id,
            "log_id": self.log_id,
            "exercise_id": self.exercise_id,
            "set_index": self.set_index,
            "reps": self.reps,
            "weight_kg": self.weight_kg,
            "rpe": self.rpe,
        }


class TrainerNote(db.Model):
    """Private notes a trainer writes about a client."""
    __tablename__ = "trainer_notes"
    id = db.Column(db.Integer, primary_key=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "trainer_id": self.trainer_id,
            "client_id": self.client_id,
            "content": self.content,
            "pinned": self.pinned,
            "created_at": self.created_at.isoformat(),
        }


class PlanTemplate(db.Model):
    """Reusable workout-plan template owned by a trainer."""
    __tablename__ = "plan_templates"
    id = db.Column(db.Integer, primary_key=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    kind = db.Column(db.String(20), default="workout")  # workout | nutrition
    data_json = db.Column(db.Text, nullable=False)  # serialized plan structure
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "trainer_id": self.trainer_id,
            "name": self.name,
            "description": self.description,
            "kind": self.kind,
            "data_json": self.data_json,
            "created_at": self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind = db.Column(db.String(30), nullable=False)  # questionnaire | plan | message | workout_done | system
    title = db.Column(db.String(160), nullable=False)
    body = db.Column(db.Text)
    link = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "title": self.title,
            "body": self.body,
            "link": self.link,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }


class Payment(db.Model):
    """A monthly payment record from a client."""
    __tablename__ = "payments"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(8), default="₸")
    period_year = db.Column(db.Integer, nullable=False)
    period_month = db.Column(db.Integer, nullable=False)  # 1..12
    paid_at = db.Column(db.Date, default=date.today, nullable=False)
    method = db.Column(db.String(40))  # cash / card / transfer / other
    note = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("client_id", "period_year", "period_month", name="uq_payment_client_period"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "trainer_id": self.trainer_id,
            "amount": self.amount,
            "currency": self.currency or "₸",
            "period_year": self.period_year,
            "period_month": self.period_month,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "method": self.method,
            "note": self.note,
            "created_at": self.created_at.isoformat(),
        }


class ScheduleEvent(db.Model):
    """A trainer's schedule slot. Either one-off (event_date set) or recurring weekly (day_of_week set)."""
    __tablename__ = "schedule_events"
    id = db.Column(db.Integer, primary_key=True)
    trainer_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"))  # optional
    title = db.Column(db.String(120), nullable=False)
    kind = db.Column(db.String(20), default="training")  # training | group | personal | block
    color = db.Column(db.String(10), default="brand")

    # one-off
    event_date = db.Column(db.Date)
    # OR recurring weekly
    day_of_week = db.Column(db.Integer)  # 0..6

    start_time = db.Column(db.String(5), nullable=False)  # "HH:MM"
    duration_min = db.Column(db.Integer, default=60, nullable=False)
    location = db.Column(db.String(120))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "trainer_id": self.trainer_id,
            "client_id": self.client_id,
            "title": self.title,
            "kind": self.kind,
            "color": self.color,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time,
            "duration_min": self.duration_min,
            "location": self.location,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, default=_now, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "sent_at": self.sent_at.isoformat(),
            "is_read": self.is_read,
        }


class GalleryPhoto(db.Model):
    __tablename__ = "gallery_photos"
    id = db.Column(db.Integer, primary_key=True)
    file_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(200))
    order_index = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "file_url": self.file_url,
            "caption": self.caption,
            "order_index": self.order_index,
            "is_featured": self.is_featured,
        }


class Setting(db.Model):
    __tablename__ = "settings"
    key = db.Column(db.String(60), primary_key=True)
    value = db.Column(db.Text)

    def to_dict(self):
        return {"key": self.key, "value": self.value}
