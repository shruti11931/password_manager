"""
backend/app.py

Full REST API for the Secure Password Manager.
Session-based unlock: after /api/unlock, a session token must be sent
with every credential request. Vault auto-locks after inactivity.
"""

import os
import re
import secrets
import string
import time
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_db
from auth import is_setup_complete, create_master_password, verify_master_password
from models import (
    add_credential, get_all_credentials, get_credential_by_id,
    update_credential, delete_credential, search_credentials
)

load_dotenv()
init_db()

app = Flask(__name__)

EXTENSION_ORIGIN = os.getenv("EXTENSION_ORIGIN", "chrome-extension://REPLACE_WITH_EXTENSION_ID")
CORS(app, origins=[EXTENSION_ORIGIN], supports_credentials=True)

SESSION_TIMEOUT_SECONDS = 300  
_session = {"token": None, "last_active": 0}


def _new_session_token() -> str:
    return secrets.token_hex(32)


def _session_valid() -> bool:
    if _session["token"] is None:
        return False
    if time.time() - _session["last_active"] > SESSION_TIMEOUT_SECONDS:
        _session["token"] = None
        return False
    return True


def _touch_session():
    _session["last_active"] = time.time()


def _require_session():
    """Returns None if valid, or an error response tuple if not."""
    token = request.headers.get("X-Session-Token")
    if not token or not _session_valid() or token != _session["token"]:
        return jsonify({"error": "Session expired or invalid. Please unlock the vault."}), 401
    _touch_session()
    return None


def is_valid_username(username: str):
    """
    Rejects empty, too short/long, gibberish (no vowels/digits), and
    repeated-pattern usernames like "hjhjhjhjhj" or "aaaaaaaa".
    Returns (is_valid: bool, error_message: str).
    """
    if not username or not isinstance(username, str):
        return False, "Username is required."

    username = username.strip()

    if len(username) < 3:
        return False, "Username must be at least 3 characters."
    if len(username) > 32:
        return False, "Username must be under 32 characters."

    # Allow letters, numbers, and common username/email punctuation
    if not re.match(r'^[A-Za-z0-9._%+@-]+$', username):
        return False, "Username can only contain letters, numbers, and . _ % + @ -"

    # Gibberish like "hjhjhjhjhj" has no vowels and no digits
    if not re.search(r'[aeiouAEIOU]', username) and not re.search(r'[0-9]', username):
        return False, "That doesn't look like a valid username."

    # Catches a short chunk (1-3 chars) repeated back-to-back, e.g. "hjhjhjhjhj"
    if re.match(r'^(.{1,3})\1{2,}$', username):
        return False, "That looks like a repeated pattern, not a real username."

    # Catches "aaaa" style runs
    if re.search(r'(.)\1{3,}', username):
        return False, "Too many repeated characters in a row."

    return True, ""


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

@app.route("/api/setup-status", methods=["GET"])
def setup_status():
    return jsonify({"setup_complete": is_setup_complete()}), 200

@app.route("/api/setup", methods=["POST"])
def setup():
    if is_setup_complete():
        return jsonify({"error": "Master password already set."}), 400

    data = request.get_json(silent=True) or {}
    password = data.get("password", "")
    if not password:
        return jsonify({"error": "Password is required."}), 400

    success, message = create_master_password(password)
    if not success:
        return jsonify({"error": message}), 400
    return jsonify({"message": message}), 201


@app.route("/api/unlock", methods=["POST"])
def unlock():
    data = request.get_json(silent=True) or {}
    password = data.get("password", "")
    if not password:
        return jsonify({"error": "Password is required."}), 400

    if not verify_master_password(password):
        return jsonify({"error": "Incorrect master password."}), 401

    _session["token"] = _new_session_token()
    _touch_session()
    return jsonify({"message": "Vault unlocked.", "session_token": _session["token"]}), 200


@app.route("/api/lock", methods=["POST"])
def lock():
    _session["token"] = None
    return jsonify({"message": "Vault locked."}), 200


@app.route("/api/verify-session", methods=["POST"])
def verify_session():
    err = _require_session()
    if err:
        return err
    return jsonify({"valid": True}), 200


@app.route("/api/credentials", methods=["GET"])
def list_credentials():
    err = _require_session()
    if err:
        return err
    query = request.args.get("q")
    if query:
        return jsonify(search_credentials(query)), 200
    return jsonify(get_all_credentials(reveal=False)), 200


@app.route("/api/credentials/<int:cred_id>", methods=["GET"])
def get_credential(cred_id):
    err = _require_session()
    if err:
        return err
    reveal = request.args.get("reveal") == "true"
    cred = get_credential_by_id(cred_id, reveal=reveal)
    if cred is None:
        return jsonify({"error": "Credential not found."}), 404
    return jsonify(cred), 200


@app.route("/api/credentials", methods=["POST"])
def create_credential():
    err = _require_session()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    website = data.get("website", "").strip()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not website:
        return jsonify({"error": "Website is required."}), 400
    if not username:
        return jsonify({"error": "Username is required."}), 400

    valid, message = is_valid_username(username)
    if not valid:
        return jsonify({"error": message}), 400

    if not password:
        return jsonify({"error": "Password is required."}), 400

    result = add_credential(website, username, password)
    return jsonify(result), 201


@app.route("/api/credentials/<int:cred_id>", methods=["PUT"])
def edit_credential(cred_id):
    err = _require_session()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    username = data.get("username")

    if username is not None:
        valid, message = is_valid_username(username)
        if not valid:
            return jsonify({"error": message}), 400

    success = update_credential(
        cred_id,
        website=data.get("website"),
        username=username,
        plaintext_password=data.get("password"),
    )
    if not success:
        return jsonify({"error": "Credential not found."}), 404
    return jsonify({"message": "Credential updated."}), 200


@app.route("/api/credentials/<int:cred_id>", methods=["DELETE"])
def remove_credential(cred_id):
    err = _require_session()
    if err:
        return err

    success = delete_credential(cred_id)
    if not success:
        return jsonify({"error": "Credential not found."}), 404
    return jsonify({"message": "Credential deleted."}), 200


@app.route("/api/generate-password", methods=["POST"])
def generate_password():
    data = request.get_json(silent=True) or {}
    length = int(data.get("length", 16))
    use_upper = data.get("uppercase", True)
    use_lower = data.get("lowercase", True)
    use_digits = data.get("numbers", True)
    use_symbols = data.get("symbols", True)

    if length < 4 or length > 128:
        return jsonify({"error": "Length must be between 4 and 128."}), 400

    pool = ""
    if use_upper:
        pool += string.ascii_uppercase
    if use_lower:
        pool += string.ascii_lowercase
    if use_digits:
        pool += string.digits
    if use_symbols:
        pool += "!@#$%^&*()-_=+"

    if not pool:
        return jsonify({"error": "At least one character type must be selected."}), 400

    password = "".join(secrets.choice(pool) for _ in range(length))
    return jsonify({"password": password}), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)