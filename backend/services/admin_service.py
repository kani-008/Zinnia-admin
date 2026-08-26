"""
Zinnia Admin — Stats & Data Management Service
"""
import os
import requests
from typing import Dict, Any, List
from services.checkin_service import get_headers, SUPABASE_URL

def get_dashboard_stats() -> Dict[str, Any]:
    headers = get_headers()
    teams_r = requests.get(f"{SUPABASE_URL}/rest/v1/teams?select=*", headers=headers)
    members_r = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?select=*", headers=headers)
    attendance_r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance?select=*", headers=headers)
    payments_r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?select=*", headers=headers)

    teams = teams_r.json() if teams_r.status_code == 200 and isinstance(teams_r.json(), list) else []
    members = members_r.json() if members_r.status_code == 200 and isinstance(members_r.json(), list) else []
    attendance = attendance_r.json() if attendance_r.status_code == 200 and isinstance(attendance_r.json(), list) else []
    payments = payments_r.json() if payments_r.status_code == 200 and isinstance(payments_r.json(), list) else []

    entry_scans = [a for a in attendance if a.get("checkin_type") == "ENTRY"]
    food_scans = [m for m in members if m.get("food_collected")]
    verified_payments = [p for p in payments if p.get("payment_status") == "VERIFIED"]
    total_revenue = sum(float(p.get("submitted_amount") or p.get("expected_amount") or 0) for p in verified_payments)

    return {
        "total_teams": len(teams),
        "total_participants": len(members),
        "entry_checked_in": len(entry_scans),
        "food_claimed": len(food_scans),
        "pending_payments": len([p for p in payments if p.get("payment_status") == "PENDING_VERIFICATION"]),
        "verified_payments": len(verified_payments),
        "total_revenue": total_revenue
    }
