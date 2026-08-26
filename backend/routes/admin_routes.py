from flask import Blueprint
from controllers.admin_controller import AdminController

admin_bp = Blueprint("admin_bp", __name__)

admin_bp.route("/api/admin/stats", methods=["GET"])(AdminController.get_stats)
admin_bp.route("/api/admin/checkin/entry", methods=["POST"])(AdminController.checkin_entry)
admin_bp.route("/api/admin/checkin/event", methods=["POST"])(AdminController.checkin_event)
admin_bp.route("/api/admin/checkin/food", methods=["POST"])(AdminController.checkin_food)
admin_bp.route("/api/admin/payments", methods=["GET"])(AdminController.get_payments)
admin_bp.route("/api/admin/payments/verify", methods=["POST"])(AdminController.verify_payment_endpoint)
admin_bp.route("/api/admin/payments/reject", methods=["POST"])(AdminController.reject_payment_endpoint)
