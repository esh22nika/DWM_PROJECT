from flask import Blueprint, current_app, jsonify, request
from utils.analytics import (
    tracked_trends_count,
    active_topics_count,
    updated_recently_count,
    platform_breakdown,
    compute_relevance_score,
    format_post_for_response
)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary')
def summary():
    """
    GET /api/dashboard/summary
    
    Returns dashboard summary statistics
    """
    try:
        ds = current_app.config['DATASTORE']
        
        # Compute statistics
        tracked = tracked_trends_count(ds)
        active = active_topics_count(ds, days=14)
        updated = updated_recently_count(ds, days=7)
        platforms = platform_breakdown(ds)
        
        # Get top topics
        top_topics = sorted(
            [
                {
                    'topic': k,
                    'mentions': v['total_mentions'],
                    'last_updated': str(v['last_updated']) if v['last_updated'] is not None else None
                }
                for k, v in ds.topics.items()
            ],
            key=lambda x: x['mentions'],
            reverse=True
        )[:10]
        
        response = {
            'tracked_trends_count': tracked,
            'active_topics_count': active,
            'updated_recently_count': updated,
            'platform_breakdown': platforms,
            'top_topics': top_topics
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/for-you')
def for_you():
    """
    GET /api/dashboard/for-you?interests=ai,ev,coding&region=India&limit=20
    
    Returns personalized feed based on user interests
    """
    try:
        ds = current_app.config['DATASTORE']
        
        # Get query parameters
        interests = request.args.get('interests', '')
        region = request.args.get('region')
        limit = int(request.args.get('limit', 20))
        
        # Compute relevance scores
        relevance_score, matched_posts = compute_relevance_score(ds, interests, region)
        
        # Format posts for response
        for_you_posts = []
        for _, row in matched_posts.head(limit).iterrows():
            post = format_post_for_response(row)
            post['relevance_score'] = round(float(row['relevance']), 2)
            for_you_posts.append(post)
        
        # Get trending posts (high engagement + recent)
        trending_posts = []
        df_trending = matched_posts[matched_posts['recency_weight'] > 0.5].nlargest(limit, 'engagement')
        for _, row in df_trending.head(10).iterrows():
            post = format_post_for_response(row)
            post['relevance_score'] = round(float(row['relevance']), 2)
            trending_posts.append(post)
        
        # Following posts (if user has followed topics - placeholder)
        following_posts = []
        
        response = {
            'relevance_score': round(relevance_score, 2),
            'for_you': for_you_posts,
            'trending': trending_posts,
            'following': following_posts
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_bp.route('/stats')
def stats():
    """
    GET /api/dashboard/stats
    
    Returns additional dashboard statistics
    """
    try:
        ds = current_app.config['DATASTORE']
        df = ds.df
        
        # Compute various stats
        total_posts = len(df)
        total_engagement = int(df['likes'].sum() + df['shares'].sum() + df['comments'].sum())
        avg_sentiment = sentiment_distribution(df)
        platform_stats = platform_detailed_stats(df)
        
        response = {
            'total_posts': total_posts,
            'total_engagement': total_engagement,
            'sentiment_distribution': avg_sentiment,
            'platform_stats': platform_stats
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def sentiment_distribution(df):
    """Calculate sentiment distribution"""
    sentiment_counts = df['sentiment'].value_counts().to_dict()
    total = len(df)
    return {
        k: {
            'count': int(v),
            'percentage': round(v / total * 100, 2)
        }
        for k, v in sentiment_counts.items()
    }

def platform_detailed_stats(df):
    """Get detailed statistics per platform"""
    stats = {}
    for platform in df['platform'].unique():
        pdata = df[df['platform'] == platform]
        stats[platform] = {
            'posts': len(pdata),
            'total_likes': int(pdata['likes'].sum()),
            'total_shares': int(pdata['shares'].sum()),
            'total_comments': int(pdata['comments'].sum()),
            'avg_engagement': round(
                (pdata['likes'].sum() + pdata['shares'].sum() + pdata['comments'].sum()) / len(pdata),
                2
            )
        }
    return stats