from pathlib import Path

from flask import Flask, jsonify, send_from_directory

from config import Config
from extensions import cors, db, jwt


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    origins = app.config["ALLOWED_ORIGINS"] or "*"
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})

    from routes import admin, auth, public

    app.register_blueprint(auth.bp)
    app.register_blueprint(public.bp)
    app.register_blueprint(admin.bp)

    upload_dir = Path(app.config["UPLOAD_DIR"])
    upload_dir.mkdir(parents=True, exist_ok=True)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "illuminartai"})

    @app.get("/uploads/<path:filename>")
    def uploads(filename):
        return send_from_directory(upload_dir, filename)

    # -------- SPA: отдаём собранный фронтенд (frontend/dist) --------
    dist: Path = app.config["FRONTEND_DIST"]

    @app.get("/")
    @app.get("/<path:path>")
    def spa(path: str = ""):
        if path.startswith(("api/", "uploads/")):
            return jsonify({"error": "Не найдено"}), 404
        if path and (dist / path).is_file():
            return send_from_directory(dist, path)
        index = dist / "index.html"
        if index.is_file():
            return send_from_directory(dist, "index.html")
        return (
            "<h1>IlluminartAI API работает</h1>"
            "<p>Фронтенд не собран: выполните <code>cd frontend && npm run build</code> "
            "или запустите dev-сервер <code>npm run dev</code>.</p>",
            200,
        )

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"error": "Не найдено"}), 404

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Файл слишком большой (макс. 8 МБ)"}), 413

    with app.app_context():
        from seeds import ensure_seed_data

        ensure_seed_data()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=not app.config["IS_PROD"])
