"""
Zinnia 2026 — Dedicated Standalone Admin Backend
"""
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Disable SSL verification warnings & patch requests globally to bypass local SSL chain errors
import ssl
import urllib3
import requests

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

_orig_request = requests.Session.request
def _patched_request(self, method, url, **kwargs):
    kwargs.setdefault('verify', False)
    return _orig_request(self, method, url, **kwargs)
requests.Session.request = _patched_request

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from flask import Flask, jsonify
from flask_cors import CORS
from routes.admin_routes import admin_bp

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(admin_bp)

    @app.route("/")
    def health():
        return jsonify({
            "success": True,
            "service": "Zinnia Admin Backend API",
            "version": "2026.1.0",
            "status": "Operational"
        })

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"
    print(f"[*] Starting Zinnia Admin Server on http://localhost:{port}")
    app.run(host=host, port=port, debug=debug)
