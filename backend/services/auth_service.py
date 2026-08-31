"""
Zinnia Admin — Authentication Service Layer
Provides username-based authentication with simple, memorable credentials for each symposium role.
"""
import os
import hmac
import hashlib
import datetime
from typing import Dict, Any, Optional

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "zin26_secure_treasurer_token_secret_key_8492048102")

# Defined roles with simple usernames and passwords (all support '123' as password)
ROLES_CREDENTIALS = {
    "treasurer": {
        "id": "treasurer_lead",
        "username": "treasurer",
        "email": "treasurer@zinnia2026.edu",
        "name": "Symposium Treasurer",
        "role": "TREASURER",
        "allowed_passwords": ["123", "treasurer", "treasurer123", "Treasurer@Zinnia2026"]
    },
    "admin": {
        "id": "admin_super",
        "username": "admin",
        "email": "admin@zinnia2026.edu",
        "name": "Super Administrator",
        "role": "SUPER_ADMIN",
        "allowed_passwords": ["123", "admin", "admin123", "Admin@Zinnia2026"]
    },
    "entry": {
        "id": "staff_entry",
        "username": "entry",
        "email": "entry@zinnia2026.edu",
        "name": "Gate Entry Staff",
        "role": "ENTRY_STAFF",
        "allowed_passwords": ["123", "entry", "gate", "gate123"]
    },
    "gate": {
        "id": "staff_entry",
        "username": "gate",
        "email": "gate@zinnia2026.edu",
        "name": "Gate Entry Staff",
        "role": "ENTRY_STAFF",
        "allowed_passwords": ["123", "entry", "gate", "gate123"]
    },
    "food": {
        "id": "staff_food",
        "username": "food",
        "email": "food@zinnia2026.edu",
        "name": "Dining Hall Staff",
        "role": "FOOD_STAFF",
        "allowed_passwords": ["123", "food", "dining", "food123"]
    },
    "event": {
        "id": "staff_event",
        "username": "event",
        "email": "event@zinnia2026.edu",
        "name": "Event Coordinator",
        "role": "EVENT_ADMIN",
        "allowed_passwords": ["123", "event", "events", "event123"]
    },
    "events": {
        "id": "staff_event",
        "username": "events",
        "email": "event@zinnia2026.edu",
        "name": "Event Coordinator",
        "role": "EVENT_ADMIN",
        "allowed_passwords": ["123", "event", "events", "event123"]
    },
    "cert": {
        "id": "staff_cert",
        "username": "cert",
        "email": "cert@zinnia2026.edu",
        "name": "Certificate & Prize Admin",
        "role": "CERTIFICATE_ADMIN",
        "allowed_passwords": ["123", "cert", "certificate", "cert123"]
    },
    "certificate": {
        "id": "staff_cert",
        "username": "certificate",
        "email": "cert@zinnia2026.edu",
        "name": "Certificate & Prize Admin",
        "role": "CERTIFICATE_ADMIN",
        "allowed_passwords": ["123", "cert", "certificate", "cert123"]
    }
}

def generate_simple_token(user_id: str, role: str) -> str:
    timestamp = str(int(datetime.datetime.now(datetime.timezone.utc).timestamp()))
    payload = f"{user_id}:{role}:{timestamp}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def authenticate_admin(username_or_email: str, password: str) -> Dict[str, Any]:
    cleaned_input = (username_or_email or "").strip().lower()
    provided_password = (password or "").strip()

    if not cleaned_input or not provided_password:
        return {"success": False, "message": "Username and password are required."}

    # Match username or email prefix
    matched_account = None
    if cleaned_input in ROLES_CREDENTIALS:
        matched_account = ROLES_CREDENTIALS[cleaned_input]
    else:
        # Check against emails or username prefixes
        for key, acc in ROLES_CREDENTIALS.items():
            if acc["email"] == cleaned_input or acc["username"] == cleaned_input:
                matched_account = acc
                break

    if not matched_account:
        return {
            "success": False, 
            "message": f"Username '{cleaned_input}' not recognized. Try 'treasurer', 'admin', 'entry', 'food', 'event', or 'cert'."
        }

    # Check password (accepts simple '123' or username or legacy passwords)
    if provided_password in matched_account["allowed_passwords"]:
        user = {
            "id": matched_account["id"],
            "username": matched_account["username"],
            "email": matched_account["email"],
            "name": matched_account["name"],
            "role": matched_account["role"]
        }
        token = generate_simple_token(user["id"], user["role"])
        return {
            "success": True,
            "message": f"Welcome, {matched_account['name']}!",
            "user": user,
            "token": token
        }
    else:
        return {
            "success": False,
            "message": f"Invalid password for '{matched_account['username']}'. Simple password is '123'."
        }
