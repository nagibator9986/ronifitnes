from datetime import datetime, date, timedelta
from calendar import monthrange
from flask import Blueprint, request, jsonify
from sqlalchemy import extract, func

from extensions import db
from models import User, Payment
from utils import role_required

bp = Blueprint("finance", __name__, url_prefix="/api/trainer/finance")


def _scope_clients(user):
    q = User.query.filter_by(role="client")
    if user.role == "trainer":
        q = q.filter_by(trainer_id=user.id)
    return q


@bp.get("/overview")
@role_required("trainer", "admin")
def overview(user):
    """Returns current-month financial overview."""
    today = date.today()
    year = int(request.args.get("year", today.year))
    month = int(request.args.get("month", today.month))

    clients = _scope_clients(user).filter_by(is_active=True).all()

    paid_map = {}
    for p in Payment.query.filter_by(period_year=year, period_month=month).all():
        paid_map[p.client_id] = p

    rows = []
    expected_total = 0
    paid_total = 0
    for c in clients:
        fee = c.monthly_fee or 0
        expected_total += fee
        p = paid_map.get(c.id)
        if p:
            paid_total += p.amount
        rows.append({
            "client": c.to_dict(),
            "monthly_fee": fee,
            "payment": p.to_dict() if p else None,
        })

    # last 6 months earnings chart
    chart = []
    for i in range(5, -1, -1):
        y, m = year, month - i
        while m <= 0:
            m += 12
            y -= 1
        total = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.period_year == y, Payment.period_month == m,
        )
        if user.role == "trainer":
            total = total.filter(Payment.trainer_id == user.id)
        chart.append({"year": y, "month": m, "total": int(total.scalar() or 0)})

    return jsonify({
        "year": year,
        "month": month,
        "rows": rows,
        "expected_total": expected_total,
        "paid_total": paid_total,
        "outstanding": expected_total - paid_total,
        "paid_count": sum(1 for r in rows if r["payment"]),
        "unpaid_count": sum(1 for r in rows if not r["payment"]),
        "chart": chart,
        "currency": (clients[0].currency if clients else "₸") or "₸",
    })


@bp.post("/clients/<int:cid>/fee")
@role_required("trainer", "admin")
def set_fee(user, cid):
    client = User.query.get_or_404(cid)
    if client.role != "client":
        return jsonify({"error": "not a client"}), 400
    if user.role == "trainer" and client.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    if "monthly_fee" in data:
        v = data["monthly_fee"]
        client.monthly_fee = int(v) if v not in (None, "", 0) else None
    if "currency" in data and data["currency"]:
        client.currency = data["currency"][:8]
    db.session.commit()
    return jsonify(client.to_dict())


@bp.post("/payments")
@role_required("trainer", "admin")
def create_payment(user):
    data = request.get_json(silent=True) or {}
    cid = data.get("client_id")
    client = User.query.get_or_404(cid)
    if user.role == "trainer" and client.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403

    year = int(data.get("period_year") or date.today().year)
    month = int(data.get("period_month") or date.today().month)

    existing = Payment.query.filter_by(client_id=cid, period_year=year, period_month=month).first()
    if existing:
        return jsonify({"error": f"Платёж за {month:02d}.{year} уже отмечен"}), 400

    amount = data.get("amount")
    if amount is None or amount == "":
        amount = client.monthly_fee or 0
    p = Payment(
        client_id=cid,
        trainer_id=client.trainer_id or user.id,
        amount=int(amount),
        currency=(data.get("currency") or client.currency or "₸")[:8],
        period_year=year,
        period_month=month,
        method=data.get("method") or None,
        note=data.get("note") or None,
        paid_at=date.fromisoformat(data["paid_at"]) if data.get("paid_at") else date.today(),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@bp.delete("/payments/<int:pid>")
@role_required("trainer", "admin")
def delete_payment(user, pid):
    p = Payment.query.get_or_404(pid)
    if user.role == "trainer" and p.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    db.session.delete(p)
    db.session.commit()
    return jsonify({"ok": True})


@bp.get("/clients/<int:cid>/payments")
@role_required("trainer", "admin")
def client_payments(user, cid):
    client = User.query.get_or_404(cid)
    if user.role == "trainer" and client.trainer_id != user.id:
        return jsonify({"error": "forbidden"}), 403
    items = Payment.query.filter_by(client_id=cid).order_by(Payment.period_year.desc(), Payment.period_month.desc()).all()
    return jsonify([p.to_dict() for p in items])


@bp.get("/earnings")
@role_required("trainer", "admin")
def earnings(user):
    """Returns earnings per month for the last 12 months."""
    today = date.today()
    rows = []
    for i in range(11, -1, -1):
        y, m = today.year, today.month - i
        while m <= 0:
            m += 12
            y -= 1
        q = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.period_year == y, Payment.period_month == m
        )
        if user.role == "trainer":
            q = q.filter(Payment.trainer_id == user.id)
        rows.append({"year": y, "month": m, "total": int(q.scalar() or 0)})

    grand_total = sum(r["total"] for r in rows)
    return jsonify({"months": rows, "grand_total": grand_total})
