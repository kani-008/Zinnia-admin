"""
Zinnia Admin — Payment Management Service
Handles payment list retrieval, verification, rejection, and triggers official QR email dispatch.
"""
import os
import datetime
import requests
from typing import Dict, Any, List
from services.checkin_service import get_headers, SUPABASE_URL
from services.email_service import send_participant_passport_email

APP_BASE_URL = os.getenv("PARTICIPANT_APP_URL", "http://localhost:5173").rstrip("/")

def list_all_payments() -> List[Dict[str, Any]]:
    headers = get_headers()
    r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?select=*,teams(*)", headers=headers)
    if r.status_code == 200 and isinstance(r.json(), list):
        return r.json()
    return []

def get_team_registered_events(team_id: str) -> List[Dict[str, Any]]:
    headers = get_headers()
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/event_registrations?team_id=eq.{team_id}&select=*,events(*)",
        headers=headers
    )
    if r.status_code == 200 and isinstance(r.json(), list):
        return r.json()
    return []

def verify_payment(team_id: str, admin_name: str = "Treasurer") -> Dict[str, Any]:
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # 1. Update team_payments table
    requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={
        "payment_status": "VERIFIED",
        "verified_at": now_iso,
        "verified_by": admin_name
    })
    
    # 2. Update teams table
    requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
        "payment": True,
        "payment_status": "VERIFIED"
    })

    # 3. Fetch team members to dispatch entry QR passes
    r_mem = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?team_id=eq.{team_id}&select=*", headers=headers)
    members = r_mem.json() if r_mem.status_code == 200 and isinstance(r_mem.json(), list) else []

    # 4. Fetch team details
    r_team = requests.get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=*", headers=headers)
    team = r_team.json()[0] if r_team.status_code == 200 and len(r_team.json()) > 0 else {"team_id": team_id, "team_name": f"Team {team_id}"}

    # 5. Fetch registered events for schedule breakdown
    registered_events = get_team_registered_events(team_id)

    # 6. Dispatch personalized entry pass with QR to each team member
    dispatched_results = []
    for m in members:
        res = send_participant_passport_email(
            member=m,
            team=team,
            registered_events=registered_events,
            app_base_url=APP_BASE_URL
        )
        dispatched_results.append(res)

    print(f"[Treasurer Action] Payment verified for {team_id}. Dispatched {len(members)} email passes.")

    return {
        "success": True,
        "message": f"Payment for team '{team.get('team_name', team_id)}' verified successfully. Official QR passes dispatched to {len(members)} participant email(s).",
        "team_id": team_id,
        "payment_status": "VERIFIED",
        "dispatched_count": len(members),
        "dispatch_details": dispatched_results
    }

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
