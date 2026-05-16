import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, send_file, abort

from config import Config
from extensions import db, jwt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    # CORS — in production the frontend is served from the same origin, so we can be strict.
    if app.config["IS_PROD"]:
        origins = os.environ.get("ALLOWED_ORIGINS", "").split(",")
        origins = [o.strip() for o in origins if o.strip()]
        cors.init_app(app, resources={r"/api/*": {"origins": origins or "*"}})
    else:
        cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    from routes.auth import bp as auth_bp
    from routes.admin import bp as admin_bp
    from routes.trainer import bp as trainer_bp
    from routes.client import bp as client_bp
    from routes.public import bp as public_bp
    from routes.notifications import bp as notif_bp
    from routes.finance import bp as finance_bp
    from routes.schedule import bp as schedule_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(trainer_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(notif_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(schedule_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True, "env": app.config["ENV"]})

    # ---------- Frontend (SPA) ----------
    dist = Path(app.config["FRONTEND_DIST"])
    has_frontend = dist.exists() and (dist / "index.html").exists()

    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def spa(path):
        # Never intercept /api/*
        if path.startswith("api/"):
            abort(404)
        if not has_frontend:
            return jsonify({
                "message": "RoniFitness API. Frontend build not found.",
                "hint": "Build frontend: cd frontend && npm run build",
            })
        # serve static assets if they exist
        if path:
            asset = dist / path
            if asset.is_file():
                return send_from_directory(dist, path)
        # SPA fallback to index.html
        return send_file(dist / "index.html")

    @app.errorhandler(404)
    def _404(_):
        return jsonify({"error": "not found"}), 404

    @app.errorhandler(413)
    def _413(_):
        return jsonify({"error": "файл слишком большой"}), 413

    @app.errorhandler(500)
    def _500(e):
        app.logger.exception("server error")
        return jsonify({"error": "internal error"}), 500

    with app.app_context():
        db.create_all()
        # auto-seed on first boot if DB is empty
        from models import User
        if User.query.count() == 0:
            try:
                from seeds import seed_logic
                seed_logic()
                app.logger.info("Auto-seeded initial data")
            except Exception:
                app.logger.exception("Auto-seed failed")

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    debug = not app.config["IS_PROD"]
    app.run(host="0.0.0.0", port=port, debug=debug)
