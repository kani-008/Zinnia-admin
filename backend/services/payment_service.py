"""
Zinnia Admin — Payment Management Service
"""
import os
import datetime
import requests
from typing import Dict, Any, List
from services.checkin_service import get_headers, SUPABASE_URL

def list_all_payments() -> List[Dict[str, Any]]:
    headers = get_headers()
    r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?select=*,teams(*)", headers=headers)
    if r.status_code == 200 and isinstance(r.json(), list):
        return r.json()
    return []

def verify_payment(team_id: str, admin_name: str = "Admin") -> Dict[str, Any]:
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={
        "payment_status": "VERIFIED",
        "verified_at": now_iso,
        "verified_by": admin_name
    })
    requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
        "payment": True,
        "payment_status": "VERIFIED"
    })
    return {"success": True, "message": f"Payment for team {team_id} successfully verified."}

def reject_payment(team_id: str, reason: str = "Invalid UTR / Incomplete payment") -> Dict[str, Any]:
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={
        "payment_status": "REJECTED",
        "rejection_reason": reason,
        "updated_at": now_iso
    })
    requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
        "payment": False,
        "payment_status": "REJECTED"
    })
    return {"success": True, "message": f"Payment for team {team_id} marked as rejected."}
