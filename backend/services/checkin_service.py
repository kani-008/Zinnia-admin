"""
Zinnia Admin — Check-in & Checkpoint Service
"""
import os
import datetime
import requests
from typing import Dict, Any, Optional, Tuple, List

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://aiefrwricgwchvapinlc.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_jP4KLIgOGvI-QIWVEBzznA_5b_FJvOL")

def get_headers(prefer_return: str = "representation") -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": f"return={prefer_return}"
    }

def lookup_member(identifier: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    cleaned = identifier.strip()
    if not cleaned:
        return None, None
    headers = get_headers()
    r = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?passport_token=eq.{cleaned}&select=*", headers=headers)
    members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
    if not members:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{cleaned}&select=*", headers=headers)
        members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
    if not members:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?email=eq.{cleaned}&select=*", headers=headers)
        members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []
    if not members:
        return None, None

    member = members[0]
    team_id = member.get("team_id")
    team = None
    if team_id:
        tr = requests.get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=*", headers=headers)
        teams = tr.json() if tr.status_code == 200 and isinstance(tr.json(), list) else []
        if teams:
            team = teams[0]
    return member, team

def process_entry_checkin(token_or_id: str, scanned_by: str = "Admin Reception", location: str = "Main Gate") -> Dict[str, Any]:
    member, team = lookup_member(token_or_id)
    if not member:
        return {"success": False, "reason": f"No participant found for '{token_or_id}'."}
    member_id = member["id"]
    headers = get_headers()
    check_r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance?member_id=eq.{member_id}&checkin_type=eq.ENTRY&select=*", headers=headers)
    if check_r.status_code == 200 and check_r.json():
        rec = check_r.json()[0]
        return {"success": False, "reason": f"Already checked in at {rec.get('scanned_at')} by {rec.get('scanned_by')}.", "member": member, "team": team}

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {
        "team_id": member["team_id"],
        "member_id": member_id,
        "passport_token_used": token_or_id,
        "participant_name": member["name"],
        "college": team.get("college", "GCE Erode") if team else "GCE Erode",
        "checkin_type": "ENTRY",
        "scanned_by": scanned_by,
        "location": location,
        "scanned_at": now_iso
    }
    requests.post(f"{SUPABASE_URL}/rest/v1/attendance", headers=headers, json=payload)
    return {"success": True, "reason": f"Entry Verified for {member['name']}!", "member": member, "team": team}

def process_event_checkin(token_or_id: str, event_id: str, scanned_by: str = "Event Admin", location: str = "Track Venue") -> Dict[str, Any]:
    member, team = lookup_member(token_or_id)
    if not member:
        return {"success": False, "reason": f"No participant found for '{token_or_id}'."}
    member_id = member["id"]
    team_id = member["team_id"]
    headers = get_headers()
    # Check registration
    reg_r = requests.get(f"{SUPABASE_URL}/rest/v1/event_registrations?team_id=eq.{team_id}&event_id=eq.{event_id}&select=*", headers=headers)
    is_reg = reg_r.status_code == 200 and bool(reg_r.json())
    if not is_reg and team and team.get("registered_events") and event_id in team.get("registered_events"):
        is_reg = True
    if not is_reg:
        return {"success": False, "reason": f"Team '{team.get('team_name') if team else team_id}' is not enrolled in event {event_id}.", "member": member}

    # Check previous scan
    check_r = requests.get(f"{SUPABASE_URL}/rest/v1/attendance?member_id=eq.{member_id}&event_id=eq.{event_id}&checkin_type=eq.EVENT&select=*", headers=headers)
    if check_r.status_code == 200 and check_r.json():
        return {"success": False, "reason": "Already checked in for this event.", "member": member, "team": team}

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {
        "team_id": team_id,
        "member_id": member_id,
        "passport_token_used": token_or_id,
        "participant_name": member["name"],
        "college": team.get("college", "GCE Erode") if team else "GCE Erode",
        "checkin_type": "EVENT",
        "event_id": event_id,
        "scanned_by": scanned_by,
        "location": location,
        "scanned_at": now_iso
    }
    requests.post(f"{SUPABASE_URL}/rest/v1/attendance", headers=headers, json=payload)
    return {"success": True, "reason": f"Event Access Granted for {member['name']}!", "member": member, "team": team}

def process_food_checkin(token_or_id: str, scanned_by: str = "Dining Staff", location: str = "Dining Hall") -> Dict[str, Any]:
    member, team = lookup_member(token_or_id)
    if not member:
        return {"success": False, "reason": f"No participant found for '{token_or_id}'."}
    if member.get("food_collected"):
        return {"success": False, "reason": f"Food token already claimed at {member.get('food_collected_at')}.", "member": member}

    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    requests.patch(f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{member['id']}", headers=headers, json={"food_collected": True, "food_collected_at": now_iso})
    member["food_collected"] = True
    member["food_collected_at"] = now_iso
    return {"success": True, "reason": f"Food token validated for {member['name']}!", "member": member, "team": team}
