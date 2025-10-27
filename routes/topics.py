from flask import Blueprint, current_app, jsonify, request
import pandas as pd
import numpy as np
from utils.analytics import topic_time_series # Import the new function

topics_bp = Blueprint('topics', __name__)

@topics_bp.route('/list')
def list_topics():
    """Lists topics, optionally filtered by a query."""
    q = request.args.get('query', '').lower()
    limit = int(request.args.get('limit', 50)) # Increased limit
    ds = current_app.config['DATASTORE']

    if ds.df.empty:
        return jsonify({'topics': []})

    topics = []
    # Sort topics by total mentions to show most relevant first
    # Ensure topics are loaded
    if not hasattr(ds, 'topics'):
        ds._build_topic_tables()
        
    # Use .get for safer access to nested dictionary
    sorted_topics = sorted(ds.topics.items(), key=lambda item: item[1].get('total_mentions', 0), reverse=True)

    for t, meta in sorted_topics:
        # Check if topic name contains the query string
        if q and q not in t.lower():
            continue

        # Ensure last_updated is a string or None
        last_updated_val = meta.get('last_updated')
        last_updated_str = str(last_updated_val) if pd.notna(last_updated_val) else None

        topics.append({
            'topic': t,
            'total_mentions': meta.get('total_mentions', 0),
            'last_updated': last_updated_str
        })
        if len(topics) >= limit:
            break

    return jsonify({'topics': topics})


@topics_bp.route('/detail')
def topic_detail():
    """Provides detailed analytics for a specific topic."""
    topic = request.args.get('topic')
    if not topic:
        return jsonify({'error': 'Topic parameter is required'}), 400

    ds = current_app.config['DATASTORE']

    # Ensure topics are loaded if needed
    if not hasattr(ds, 'topics'):
        ds._build_topic_tables()


    if ds.df.empty or topic not in ds.topics:
        return jsonify({'error': 'Topic not found'}), 404

    # Get time series data using the function from analytics.py
    series = topic_time_series(ds, topic)

    # Get sample posts, ensuring data types are JSON-serializable
    topic_df = ds.df[ds.df['topic'] == topic].copy() # Work on a copy
    sample_posts_df = topic_df.sort_values('timestamp', ascending=False).head(10)

    # Convert timestamps to ISO 8601 strings
    sample_posts_df['timestamp'] = sample_posts_df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    # Fill potential NaN values in numeric columns before converting to int/float
    numeric_cols = ['likes', 'shares', 'comments']
    for col in numeric_cols:
        if col in sample_posts_df.columns:
             sample_posts_df[col] = pd.to_numeric(sample_posts_df[col], errors='coerce').fillna(0).astype(int)
        else:
             sample_posts_df[col] = 0 # Add column if missing


    # Convert relevant columns to native Python types for JSON serialization
    sample_posts = []
    for record in sample_posts_df.to_dict('records'):
         # Ensure all values are JSON serializable
         serializable_record = {}
         for key, value in record.items():
              if isinstance(value, (pd.Timestamp, pd.Timedelta)):
                   serializable_record[key] = str(value)
              elif pd.isna(value):
                   serializable_record[key] = None # Use None for NaN/NaT
              elif isinstance(value, (np.int64, np.int32)):
                   serializable_record[key] = int(value)
              elif isinstance(value, (np.float64, np.float32)):
                  serializable_record[key] = float(value)
              else:
                   serializable_record[key] = value
         sample_posts.append(serializable_record)


    # Calculate Basic sentiment trend (daily average score)
    topic_df['day'] = topic_df['timestamp'].dt.normalize() # Normalize to day
    sentiment_map = {'Positive': 1, 'Neutral': 0, 'Negative': -1}
    topic_df['sentiment_score'] = topic_df['sentiment'].map(sentiment_map).fillna(0) # Default to Neutral if NaN

    sentiment_trend_df = topic_df.groupby('day')['sentiment_score'].mean().reset_index()
    sentiment_trend = [
        {'date': row['day'].strftime('%Y-%m-%d'), 'avg_sentiment_score': round(row['sentiment_score'], 2)}
        for _, row in sentiment_trend_df.iterrows()
    ]
    sentiment_trend.sort(key=lambda x: x['date']) # Sort by date


    # Calculate Engagement over time (daily sums)
    topic_df['likes'] = pd.to_numeric(topic_df['likes'], errors='coerce').fillna(0)
    topic_df['shares'] = pd.to_numeric(topic_df['shares'], errors='coerce').fillna(0)
    topic_df['comments'] = pd.to_numeric(topic_df['comments'], errors='coerce').fillna(0)

    engagement_trend_df = topic_df.groupby('day').agg(
        likes=('likes', 'sum'),
        shares=('shares', 'sum'),
        comments=('comments', 'sum')
    ).reset_index()
    engagement_over_time = [
        {
            'date': row['day'].strftime('%Y-%m-%d'),
            'likes': int(row['likes']),
            'shares': int(row['shares']),
            'comments': int(row['comments'])
        }
        for _, row in engagement_trend_df.iterrows()
    ]
    engagement_over_time.sort(key=lambda x: x['date']) # Sort by date

    # (Optional) Find related topics - simple co-occurrence in user sessions or content could be added later
    related_topics = [] # Placeholder

    return jsonify({
        'topic': topic,
        'time_series': series,
        'sample_posts': sample_posts,
        'sentiment_trend': sentiment_trend,
        'engagement_over_time': engagement_over_time,
        'related_topics': related_topics # Add related topics if implemented
    })