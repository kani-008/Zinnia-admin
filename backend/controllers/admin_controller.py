from flask import request, jsonify
from services.admin_service import get_dashboard_stats
from services.checkin_service import process_entry_checkin, process_event_checkin, process_food_checkin, lookup_member
from services.payment_service import list_all_payments, verify_payment, reject_payment

class AdminController:
    @staticmethod
    def get_stats():
        stats = get_dashboard_stats()
        return jsonify({"success": True, "stats": stats})

    @staticmethod
    def checkin_entry():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        scanned_by = data.get("scanned_by", "Admin Gate")
        location = data.get("location", "Main Campus Gate")
        res = process_entry_checkin(token, scanned_by, location)
        return jsonify(res), 200 if res.get("success") else 400

    @staticmethod
    def checkin_event():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        event_id = data.get("event_id", "")
        scanned_by = data.get("scanned_by", "Event Coordinator")
        location = data.get("location", "Track Venue")
        res = process_event_checkin(token, event_id, scanned_by, location)
        return jsonify(res), 200 if res.get("success") else 400

    @staticmethod
    def checkin_food():
        data = request.get_json(silent=True) or {}
        token = data.get("token") or data.get("passport_token") or data.get("id", "")
        scanned_by = data.get("scanned_by", "Dining Staff")
        location = data.get("location", "Dining Hall")
        res = process_food_checkin(token, scanned_by, location)
        return jsonify(res), 200 if res.get("success") else 400

    @staticmethod
    def get_payments():
        return jsonify({"success": True, "payments": list_all_payments()})

    @staticmethod
    def verify_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        admin_name = data.get("admin_name", "Admin")
        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id"}), 400
        return jsonify(verify_payment(team_id, admin_name))

    @staticmethod
    def reject_payment_endpoint():
        data = request.get_json(silent=True) or {}
        team_id = data.get("team_id")
        reason = data.get("reason", "Payment verification rejected")
        if not team_id:
            return jsonify({"success": False, "error": "Missing team_id"}), 400
        return jsonify(reject_payment(team_id, reason))
