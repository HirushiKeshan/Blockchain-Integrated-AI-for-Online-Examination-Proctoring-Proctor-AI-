from flask import Blueprint, jsonify

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/status')
def detection_status():
    return jsonify({'status': 'detection working'})
