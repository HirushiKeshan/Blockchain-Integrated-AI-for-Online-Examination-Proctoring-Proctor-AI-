from flask import Blueprint, jsonify

coding_bp = Blueprint('coding', __name__)

@coding_bp.route('/status')
def coding_status():
    return jsonify({'status': 'coding working'})
