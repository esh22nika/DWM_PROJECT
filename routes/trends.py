from flask import Blueprint, current_app, jsonify, request
from utils.analytics import analyze_trends, platform_comparison

trends_bp = Blueprint('trends', __name__)

@trends_bp.route('/overview')
def overview():
    """Provides an overview of emerging, declining, and peak topics."""
    days = int(request.args.get('days', 90))
    ds = current_app.config['DATASTORE']
    if ds.df.empty:
        return jsonify({
            "emerging_topics": [], "declining_topics": [], "peak_topics": [], "active_topics": [],
            "trend_timeline": {"categories": [], "series": {}}
        })
    res = analyze_trends(ds, days=days)
    return jsonify(res)

@trends_bp.route('/platform-comparison')
def platform_comp():
    """Compares topic performance across different platforms."""
    topic = request.args.get('topic')
    start = request.args.get('start')
    end = request.args.get('end')
    
    if not topic:
        return jsonify({"error": "Topic parameter is required"}), 400

    ds = current_app.config['DATASTORE']
    if ds.df.empty:
        return jsonify({})

    res = platform_comparison(ds, topic, start=start, end=end)
    return jsonify(res)