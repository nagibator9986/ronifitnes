from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify

from extensions import db
from models import User, ScheduleEvent, WorkoutPlan
from utils import role_required, notify

bp = Blueprint("schedule", __name__, url_prefix="/api/trainer/schedule")


def _client_label(cid):
    if not cid:
        return None
    u = db.session.get(User, cid)
    return u.full_name if u else None


def _serialize(ev):
    out = ev.to_dict()
    out["client_name"] = _client_label(ev.client_id)
    return out


@bp.get("/week")
@role_required("trainer", "admin")
def week(user):
    """Returns a Mon-Sun overview combining schedule events + workout-plan days."""
    start = request.args.get("start")
    if start:
        monday = date.fromisoformat(start)
    else:
        today = date.today()
        monday = today - timedelta(days=today.weekday())

    # All schedule events visible to this trainer
    q = ScheduleEvent.query
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    events = q.all()

    # collect client plans (the client's WorkoutDay items count as auto-events
    # only when no explicit ScheduleEvent overrides it).
    plans_q = WorkoutPlan.query.filter_by(is_active=True)
    if user.role == "trainer":
        plans_q = plans_q.filter_by(trainer_id=user.id)
    plans = plans_q.all()

    days = []
    for di in range(7):
        d = monday + timedelta(days=di)
        items = []

        for ev in events:
            if ev.event_date and ev.event_date == d:
                items.append(_serialize(ev))
            elif ev.event_date is None and ev.day_of_week == di:
                items.append(_serialize(ev))

        for plan in plans:
            for wd in plan.days:
                if wd.day_of_week == di:
                    client = db.session.get(User, plan.client_id)
                    items.append({
                        "id": f"plan-{wd.id}",
                        "auto": True,
                        "title": (wd.title or "Тренировка"),
                        "kind": "training",
                        "color": "brand",
                        "start_time": wd.time_of_day or "—",
                        "duration_min": 60,
                        "client_id": plan.client_id,
                        "client_name": client.full_name if client else None,
                        "day_id": wd.id,
                        "notes": wd.notes,
                    })

        items.sort(key=lambda x: (x.get("start_time") or "99:99"))
        days.append({
            "date": d.isoformat(),
            "day_of_week": di,
            "is_today": d == date.today(),
            "items": items,
        })
    return jsonify({"start": monday.isoformat(), "days": days})


@bp.get("/today")
@role_required("trainer", "admin")
def today(user):
    today_d = date.today()
    di = today_d.weekday()

    q = ScheduleEvent.query
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    items = []
    for ev in q.all():
        if (ev.event_date and ev.event_date == today_d) or (ev.event_date is None and ev.day_of_week == di):
            items.append(_serialize(ev))

    # autoload from workout plans
    plans_q = WorkoutPlan.query.filter_by(is_active=True)
    if user.role == "trainer":
        plans_q = plans_q.filter_by(trainer_id=user.id)
    for plan in plans_q.all():
        for wd in plan.days:
            if wd.day_of_week == di:
                client = db.session.get(User, plan.client_id)
                items.append({
                    "id": f"plan-{wd.id}",
                    "auto": True,
                    "title": wd.title or "Тренировка",
                    "kind": "training",
                    "color": "brand",
                    "start_time": wd.time_of_day or "—",
                    "duration_min": 60,
                    "client_id": plan.client_id,
                    "client_name": client.full_name if client else None,
                    "day_id": wd.id,
                })
    items.sort(key=lambda x: (x.get("start_time") or "99:99"))
    return jsonify({"date": today_d.isoformat(), "items": items})


@bp.post("")
@role_required("trainer", "admin")
def create(user):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title required"}), 400
    if not data.get("start_time"):
        return jsonify({"error": "start_time required"}), 400

    ev = ScheduleEvent(
        trainer_id=user.id if user.role == "trainer" else (data.get("trainer_id") or user.id),
        client_id=data.get("client_id") or None,
        title=title,
        kind=data.get("kind") or "training",
        color=data.get("color") or "brand",
        event_date=date.fromisoformat(data["event_date"]) if data.get("event_date") else None,
        day_of_week=data.get("day_of_week") if data.get("day_of_week") is not None else None,
        start_time=data["start_time"],
        duration_min=int(data.get("duration_min") or 60),
        location=data.get("location"),
        notes=data.get("notes"),
    )
    if ev.event_date is None and ev.day_of_week is None:
        return jsonify({"error": "either event_date or day_of_week required"}), 400

    db.session.add(ev)

    # notify the client
    if ev.client_id:
        when = ev.event_date.isoformat() if ev.event_date else f"каждую неделю в {['пн','вт','ср','чт','пт','сб','вс'][ev.day_of_week]}"
        notify(ev.client_id, "system",
               f"Назначена тренировка: {title}",
               f"{when} в {ev.start_time}", "/app/calendar")
    db.session.commit()
    return jsonify(_serialize(ev)), 201


@bp.patch("/<int:eid>")
@role_required("trainer", "admin")
def update(user, eid):
    ev = ScheduleEvent.query.get_or_404(eid)
    if user.role == "trainer" and ev.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    for f in ("title", "kind", "color", "location", "notes", "start_time"):
        if f in data:
            setattr(ev, f, data[f])
    if "duration_min" in data:
        ev.duration_min = int(data["duration_min"])
    if "client_id" in data:
        ev.client_id = data["client_id"] or None
    if "event_date" in data:
        ev.event_date = date.fromisoformat(data["event_date"]) if data["event_date"] else None
    if "day_of_week" in data:
        ev.day_of_week = data["day_of_week"] if data["day_of_week"] is not None else None
    db.session.commit()
    return jsonify(_serialize(ev))


@bp.delete("/<int:eid>")
@role_required("trainer", "admin")
def delete(user, eid):
    ev = ScheduleEvent.query.get_or_404(eid)
    if user.role == "trainer" and ev.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(ev)
    db.session.commit()
    return jsonify({"ok": True})
