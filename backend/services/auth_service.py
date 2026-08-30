"""
Zinnia Admin — Authentication Service Layer
Provides secure authentication for the Treasurer and Symposium Administrators.
"""
import os
import hmac
import hashlib
import datetime
from typing import Dict, Any, Optional

TREASURER_EMAIL = os.getenv("TREASURER_EMAIL", "treasurer@zinnia2026.edu").strip().lower()
TREASURER_PASSWORD = os.getenv("TREASURER_PASSWORD", "Treasurer@Zinnia2026")
TREASURER_NAME = os.getenv("TREASURER_NAME", "Official Symposium Treasurer")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@zinnia2026.edu").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@Zinnia2026")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Super Administrator")

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "zin26_secure_treasurer_token_secret_key_8492048102")

def generate_simple_token(user_id: str, role: str) -> str:
    timestamp = str(int(datetime.datetime.now(datetime.timezone.utc).timestamp()))
    payload = f"{user_id}:{role}:{timestamp}"
    signature = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{signature}"

def authenticate_admin(email: str, password: str) -> Dict[str, Any]:
    cleaned_email = (email or "").strip().lower()
    provided_password = password or ""

    if not cleaned_email or not provided_password:
        return {"success": False, "message": "Email and password are required."}

    # 1. Check Treasurer Credentials
    if cleaned_email == TREASURER_EMAIL:
        if provided_password == TREASURER_PASSWORD:
            user = {
                "id": "treasurer_lead",
                "email": TREASURER_EMAIL,
                "name": TREASURER_NAME,
                "role": "TREASURER"
            }
            token = generate_simple_token(user["id"], user["role"])
            return {
                "success": True,
                "message": f"Welcome, {TREASURER_NAME}. Authenticated as Treasurer.",
                "user": user,
                "token": token
            }
        else:
            return {"success": False, "message": "Invalid password for Treasurer."}

    # 2. Check Super Admin Credentials
    if cleaned_email == ADMIN_EMAIL:
        if provided_password == ADMIN_PASSWORD:
            user = {
                "id": "admin_super",
                "email": ADMIN_EMAIL,
                "name": ADMIN_NAME,
                "role": "SUPER_ADMIN"
            }
            token = generate_simple_token(user["id"], user["role"])
            return {
                "success": True,
                "message": f"Welcome, {ADMIN_NAME}. Authenticated as Super Admin.",
                "user": user,
                "token": token
            }
        else:
            return {"success": False, "message": "Invalid password for Administrator."}

    return {
        "success": False, 
        "message": "Account not recognized. Please check your admin/treasurer email address."
    }
