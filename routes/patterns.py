from flask import Blueprint, current_app, jsonify, request
from utils.analytics import (
    pattern_rules,
    sequential_patterns,
    topic_network_analysis,
    trend_analysis,
    cross_platform_patterns,
)

patterns_bp = Blueprint("patterns", __name__)


@patterns_bp.route("/association-rules")
def association_rules():
    """Returns advanced association rules using Apriori algorithm with meaningful metrics."""
    limit = int(request.args.get("limit", 50))
    min_trend_strength = float(request.args.get("min_trend_strength", 0.02))
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify([])

    res = pattern_rules(ds, limit=limit, min_trend_strength=min_trend_strength)
    return jsonify(res)


@patterns_bp.route("/top")
def top_patterns():
    """Legacy endpoint - redirects to association rules for backward compatibility."""
    return association_rules()


@patterns_bp.route("/sequential")
def sequential():
    """Returns sequential patterns showing topic progression over time."""
    limit = int(request.args.get("limit", 30))
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify([])

    res = sequential_patterns(ds, limit=limit)
    return jsonify(res)


@patterns_bp.route("/graph")
def graph():
    """Generates advanced topic co-occurrence network graph with meaningful metrics."""
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify({"nodes": [], "edges": []})

    res = topic_network_analysis(ds)
    return jsonify(res)


@patterns_bp.route("/trends")
def trends():
    """Analyzes emerging, declining, and stable trends."""
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify({"emerging": [], "declining": [], "stable": []})

    res = trend_analysis(ds)
    return jsonify(res)


@patterns_bp.route("/cross-platform")
def cross_platform():
    """Analyzes patterns across different platforms."""
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify([])

    res = cross_platform_patterns(ds)
    return jsonify(res)


@patterns_bp.route("/itemsets")
def frequent_itemsets():
    """Returns frequent itemsets with trend strength metrics."""
    limit = int(request.args.get("limit", 50))
    min_trend_strength = float(request.args.get("min_trend_strength", 0.02))
    ds = current_app.config["DATASTORE"]

    if ds.df.empty:
        return jsonify([])

    # Get association rules and extract itemset data
    rules = pattern_rules(ds, limit=limit, min_trend_strength=min_trend_strength)

    # Convert rules to itemset format
    itemsets = []
    for rule in rules:
        if "antecedent" in rule and "consequent" in rule:
            items = rule["antecedent"] + rule["consequent"]
            itemsets.append(
                {
                    "items": items,
                    "trend_strength": rule.get("trend_strength", 0),
                    "popularity_score": rule.get("popularity_score", 0),
                    "occurrence_count": rule.get("occurrence_count", 0),
                    "growth_rate": rule.get("growth_rate", 0),
                    "trend_direction": rule.get("trend_direction", "➡️ Stable"),
                }
            )

    return jsonify(itemsets)
