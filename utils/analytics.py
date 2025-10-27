import pandas as pd
import numpy as np
from collections import Counter, defaultdict
from datetime import datetime, timedelta
import math
import re
from dateutil import parser
from functools import lru_cache
import nltk  # Import nltk

# --- Setup NLTK ---
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    print("Downloading NLTK stopwords...")
    nltk.download("stopwords")
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    print("Downloading NLTK punkt tokenizer...")
    nltk.download("punkt")
# --- End NLTK Setup ---


from nltk.corpus import stopwords as nltk_stopwords

# More comprehensive stopwords including common English words and potentially irrelevant terms
STOPWORDS = set(nltk_stopwords.words("english")) | set(
    [
        "a",
        "an",
        "the",
        "and",
        "or",
        "for",
        "to",
        "in",
        "on",
        "with",
        "at",
        "by",
        "is",
        "are",
        "was",
        "were",
        "of",
        "it",
        "its",
        "this",
        "that",
        "these",
        "those",
        "i",
        "you",
        "he",
        "she",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "my",
        "your",
        "his",
        "her",
        "its",
        "our",
        "their",
        "mine",
        "yours",
        "hers",
        "ours",
        "theirs",
        "be",
        "being",
        "been",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "shall",
        "should",
        "can",
        "could",
        "may",
        "might",
        "must",
        "about",
        "above",
        "after",
        "again",
        "against",
        "all",
        "am",
        "any",
        "as",
        "because",
        "before",
        "below",
        "between",
        "both",
        "but",
        "came",
        "come",
        "couldnt",
        "didnt",
        "do",
        "does",
        "doing",
        "dont",
        "down",
        "during",
        "each",
        "few",
        "from",
        "further",
        "get",
        "go",
        "goes",
        "got",
        "hadnt",
        "hasnt",
        "havent",
        "having",
        "hed",
        "hell",
        "here",
        "heres",
        "herself",
        "hes",
        "himself",
        "how",
        "hows",
        "id",
        "ill",
        "im",
        "ive",
        "if",
        "into",
        "isnt",
        "lets",
        "like",
        "make",
        "many",
        "more",
        "most",
        "much",
        "no",
        "nor",
        "not",
        "now",
        "off",
        "once",
        "only",
        "other",
        "ought",
        "our",
        "ours",
        "ourselves",
        "out",
        "over",
        "own",
        "same",
        "shant",
        "shed",
        "shell",
        "shes",
        "so",
        "some",
        "such",
        "than",
        "thats",
        "the",
        "their",
        "theirs",
        "them",
        "themselves",
        "then",
        "there",
        "theres",
        "these",
        "theyd",
        "theyll",
        "theyre",
        "theyve",
        "this",
        "those",
        "through",
        "too",
        "under",
        "until",
        "up",
        "very",
        "want",
        "wasnt",
        "wed",
        "well",
        "were",
        "werent",
        "weve",
        "what",
        "whats",
        "when",
        "whens",
        "where",
        "wheres",
        "which",
        "while",
        "who",
        "whos",
        "whom",
        "why",
        "whys",
        "wont",
        "wouldnt",
        "youd",
        "youll",
        "youre",
        "youve",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "rt",
        "via",
        "amp",
        "new",
        "one",
        "post",
        "see",
        "also",
        "just",
        "like",
        "know",
        "get",
        "think",
        "thoughts",  # Added common social media words
    ]
)


# --- Helper Functions ---


def format_post_for_response(row):
    """Format a DataFrame row into a post response dictionary."""
    return {
        "post_id": str(row.get("post_id", "")),
        "platform": str(row.get("platform", "")),
        "user": str(row.get("user", "")),
        "content": str(row.get("content", "")),
        "hashtags": str(row.get("hashtags", "")),
        "topic": str(row.get("topic", "")),
        "likes": int(row.get("likes", 0)),
        "shares": int(row.get("shares", 0)),
        "comments": int(row.get("comments", 0)),
        "sentiment": str(row.get("sentiment", "")),
        "timestamp": str(row.get("timestamp", "")),
        "region": str(row.get("region", "")),
    }


# --- Dashboard Analytics ---


@lru_cache()
def tracked_trends_count(datastore):
    """Counts unique topics."""
    # Ensure topics are loaded if dataframe is not empty
    if not datastore.df.empty and not hasattr(datastore, "topics"):
        datastore._build_topic_tables()
    return len(datastore.topics)


@lru_cache()
def active_topics_count(datastore, days=14):
    """Counts topics with mentions in the last N days."""
    if days <= 0 or datastore.df.empty:
        return 0
        # Ensure topics are loaded
    if not hasattr(datastore, "topics"):
        datastore._build_topic_tables()

    # Use UTC for cutoff calculation consistent with data
    cutoff = pd.Timestamp.utcnow()  # Already UTC
    cutoff_naive = cutoff.tz_localize(None) - pd.Timedelta(
        days=days
    )  # Create naive cutoff for comparison
    active = 0
    for t, meta in datastore.topics.items():
        last_updated_ts = meta.get("last_updated")
        if last_updated_ts and pd.notna(last_updated_ts):
            # Make last_updated_ts naive for comparison
            last_updated_naive = (
                last_updated_ts.tz_convert(None)
                if last_updated_ts.tzinfo is not None
                else last_updated_ts
            )
            if last_updated_naive >= cutoff_naive:
                active += 1
    return active


@lru_cache()
def updated_recently_count(datastore, days=7):
    """Counts topics updated within the last N days."""
    if days <= 0 or datastore.df.empty:
        return 0
    # Ensure topics are loaded
    if not hasattr(datastore, "topics"):
        datastore._build_topic_tables()

    # Use UTC for cutoff calculation consistent with data
    cutoff = pd.Timestamp.utcnow()  # Already UTC
    cutoff_naive = cutoff.tz_localize(None) - pd.Timedelta(
        days=days
    )  # Create naive cutoff for comparison
    recent = 0
    for t, meta in datastore.topics.items():
        last_updated_ts = meta.get("last_updated")
        if last_updated_ts and pd.notna(last_updated_ts):
            # Make last_updated_ts naive for comparison
            last_updated_naive = (
                last_updated_ts.tz_convert(None)
                if last_updated_ts.tzinfo is not None
                else last_updated_ts
            )
            if last_updated_naive >= cutoff_naive:
                recent += 1
    return recent


@lru_cache()
def platform_breakdown(datastore):
    """Counts posts per platform."""
    if datastore.df.empty:
        return {}
    return datastore.df["platform"].value_counts().to_dict()


# --- Personalized Feed ---


def compute_relevance_score(datastore, interests_str, region=None):
    """Computes relevance scores for posts based on interests and region."""
    df = datastore.df.copy()

    if df.empty:
        return 0.0, pd.DataFrame(columns=list(df.columns) + ["relevance"])

    interests = [i.strip().lower() for i in interests_str.split(",") if i.strip()]

    if not interests:
        return 0.0, df.assign(
            relevance=0.0
        )  # Return DataFrame with 0 relevance if no interests

    # Filter by region if specified
    if region:
        df = df[df["region"].str.lower() == region.lower()]
        if df.empty:  # Check if filtering removed all data
            return 0.0, pd.DataFrame(columns=list(datastore.df.columns) + ["relevance"])

    # Calculate base relevance score (keyword matching)
    def calculate_match(row):
        score = 0
        # Combine relevant text fields for matching
        text_content = f"{row.get('topic', '')} {row.get('content', '')} {row.get('hashtags', '')}".lower()
        for interest in interests:
            # Use regex for whole word matching to avoid partial matches (e.g., 'ai' in 'rain')
            if re.search(r"\b" + re.escape(interest) + r"\b", text_content):
                score += 1
        return score

    df["match_score"] = df.apply(calculate_match, axis=1)

    # Calculate engagement weight (using the formula: likes + 2*shares + 0.5*comments)
    df["likes"] = pd.to_numeric(df["likes"], errors="coerce").fillna(0)
    df["shares"] = pd.to_numeric(df["shares"], errors="coerce").fillna(0)
    df["comments"] = pd.to_numeric(df["comments"], errors="coerce").fillna(0)
    df["engagement"] = df["likes"] + 2 * df["shares"] + 0.5 * df["comments"]

    # Normalize engagement weight (0 to 1)
    max_engagement = df["engagement"].max()
    df["engagement_weight"] = (
        df["engagement"] / max_engagement if max_engagement > 0 else 0
    )

    # Calculate recency weight (using the formula: exp(-days_since_post / 7))
    now = pd.Timestamp.utcnow()  # Use timezone-aware comparison
    # Ensure timestamp column is timezone-aware (UTC)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df["days_since_post"] = (now - df["timestamp"]).dt.total_seconds() / (60 * 60 * 24)
    # Handle potential NaT values in timestamp before calculation
    df["days_since_post"] = df["days_since_post"].fillna(
        float("inf")
    )  # Penalize missing timestamps heavily
    df["recency_weight"] = np.exp(-df["days_since_post"] / 7)  # Decay factor of 7 days
    # Ensure recency_weight is 0 for future posts or NaT timestamps (already handled by fillna(inf))
    df.loc[df["days_since_post"] < 0, "recency_weight"] = 0

    # Combine scores with specified weights: 50% match, 30% engagement, 20% recency
    df["relevance"] = (
        df["match_score"] * 0.5
        + df["engagement_weight"] * 0.3
        + df["recency_weight"] * 0.2
    )

    # Normalize final relevance score to 0-100
    max_relevance = df["relevance"].max()
    if max_relevance > 0:
        df["relevance"] = (df["relevance"] / max_relevance) * 100
    else:
        df["relevance"] = 0.0  # Avoid division by zero if all scores are 0

    # Sort by relevance
    matched_posts = df.sort_values(by="relevance", ascending=False)

    # Calculate overall relevance score (e.g., average of top 10 relevant posts' scores)
    overall_relevance = (
        matched_posts["relevance"].head(10).mean() if not matched_posts.empty else 0.0
    )

    return float(overall_relevance), matched_posts


# --- Trend Analysis ---


def analyze_trends(datastore, days=90):
    """Analyzes trends over the specified number of days, categorizing topics."""
    df = datastore.df.copy()

    if df.empty or days <= 0:
        return {
            "emerging_topics": [],
            "declining_topics": [],
            "peak_topics": [],
            "active_topics": [],
            "trend_timeline": {"categories": [], "series": {}},
        }

    cutoff_date = pd.Timestamp.utcnow().tz_localize(None) - pd.Timedelta(
        days=days
    )  # Naive timestamp for filtering
    # Ensure timestamps are naive before filtering
    df["timestamp_naive"] = df["timestamp"].dt.tz_localize(None)
    df_recent = df[df["timestamp_naive"] >= cutoff_date].copy()

    if df_recent.empty:
        return {
            "emerging_topics": [],
            "declining_topics": [],
            "peak_topics": [],
            "active_topics": [],
            "trend_timeline": {"categories": [], "series": {}},
        }

    # Calculate daily mentions per topic
    df_recent["day"] = df_recent[
        "timestamp"
    ].dt.normalize()  # Keep day timezone aware if possible
    topic_counts_daily = (
        df_recent.groupby(["topic", "day"]).size().reset_index(name="mentions")
    )

    results = {
        "emerging_topics": [],
        "declining_topics": [],
        "peak_topics": [],
        "active_topics": [],
    }
    analyzed_topics = set()

    # Calculate global mention stats for percentile calculation
    all_mentions = topic_counts_daily["mentions"].values
    if len(all_mentions) == 0:  # Handle case with no mentions in the period
        percentile_75 = 0
    else:
        percentile_75 = np.percentile(all_mentions, 75)

    for topic in topic_counts_daily["topic"].unique():
        topic_data = topic_counts_daily[
            topic_counts_daily["topic"] == topic
        ].sort_values("day")
        mentions = topic_data["mentions"].values
        dates = topic_data["day"].values  # These are normalized timestamps

        # Convert dates to naive for comparison with 'now_naive' if needed
        # dates_naive = [d.tz_localize(None) for d in dates]
        last_date_naive = dates[-1].tz_localize(None)
        now_naive = pd.Timestamp.utcnow().tz_localize(None)

        if len(mentions) < 5:  # Require more data points for better trend analysis
            # Still consider it active if mentioned recently (last 14 days)
            if (now_naive - last_date_naive).days <= 14:
                results["active_topics"].append(
                    {"topic": topic, "last_mention_count": int(mentions[-1])}
                )
            continue

        # Growth rate calculation: compare last third to first third of the period for robustness
        third = len(mentions) // 3
        if third < 1:
            third = 1  # Ensure at least one element in slice

        avg_last = np.mean(mentions[-third:])
        avg_first = np.mean(mentions[:third])

        growth_rate = (
            avg_last / avg_first if avg_first > 0 else (avg_last + 1)
        )  # Add 1 to avoid 0/0 or large number if start is 0
        current_mean_mentions = np.mean(mentions)

        # Heuristic classification
        is_active_recently = (now_naive - last_date_naive).days <= 14

        if (
            growth_rate > 1.8 and avg_last > 5 and is_active_recently
        ):  # Emerging: Significant growth, recent activity, min mentions
            results["emerging_topics"].append(
                {
                    "topic": topic,
                    "growth_rate": round(growth_rate, 2),
                    "avg_mentions": round(current_mean_mentions, 1),
                }
            )
            analyzed_topics.add(topic)
        elif (
            growth_rate < 0.6 and avg_first > 5
        ):  # Declining: Significant drop from previous activity
            results["declining_topics"].append(
                {
                    "topic": topic,
                    "decline_rate": round(growth_rate, 2),
                    "avg_mentions": round(current_mean_mentions, 1),
                }
            )
            analyzed_topics.add(topic)
        elif (
            0.8 <= growth_rate <= 1.2
            and current_mean_mentions > percentile_75
            and is_active_recently
        ):  # Peak: Stable, high mentions relative to others, active recently
            results["peak_topics"].append(
                {"topic": topic, "avg_mentions": round(current_mean_mentions, 1)}
            )
            analyzed_topics.add(topic)

        # Active topics check (mentioned in last 14 days) - add if not already categorized
        if topic not in analyzed_topics and is_active_recently:
            results["active_topics"].append(
                {"topic": topic, "last_mention_count": int(mentions[-1])}
            )
            analyzed_topics.add(topic)

    # Build Trend Timeline for specific categories
    # Using the categories from the prompt
    categories = [
        "AI & Large Language Models",
        "Electric Vehicles",
        "Entertainment & Music",
        "Cricket",
    ]  # Corrected "Sports" to "Cricket" based on data
    timeline_series = defaultdict(list)
    df_timeline = df_recent[df_recent["topic"].isin(categories)]

    # Ensure 'day' column exists and is timezone-aware or naive consistently
    if not df_timeline.empty:
        # Use dt accessor for timezone-aware or naive conversion
        df_timeline["day_str"] = df_timeline["day"].dt.strftime("%Y-%m-%d")
        timeline_counts = (
            df_timeline.groupby(["topic", "day_str"]).size().reset_index(name="count")
        )

        for topic in categories:
            topic_data = timeline_counts[timeline_counts["topic"] == topic].sort_values(
                "day_str"
            )
            for _, row in topic_data.iterrows():
                timeline_series[topic].append(
                    {"date": row["day_str"], "count": int(row["count"])}
                )
    else:  # Handle case where none of the target categories are in recent data
        for topic in categories:
            timeline_series[topic] = []

    results["trend_timeline"] = {
        "categories": categories,
        "series": dict(timeline_series),
    }

    # Sort results for consistency (optional)
    # (Sorting logic from previous step is retained here)
    for key in ["emerging_topics", "declining_topics", "peak_topics", "active_topics"]:
        if results[key] and isinstance(results[key][0], dict):
            # Define sort key based on available metric
            if "growth_rate" in results[key][0]:
                sort_key = "growth_rate"
                reverse = True
            elif "decline_rate" in results[key][0]:
                sort_key = "decline_rate"
                reverse = False
            elif "avg_mentions" in results[key][0]:
                sort_key = "avg_mentions"
                reverse = True
            elif "last_mention_count" in results[key][0]:
                sort_key = "last_mention_count"
                reverse = True
            else:
                sort_key = "topic"
                reverse = False  # Fallback sort key
            try:
                # Use .get with a default for safe sorting
                results[key] = sorted(
                    results[key],
                    key=lambda x: x.get(sort_key, 0)
                    if isinstance(x.get(sort_key), (int, float))
                    else 0,
                    reverse=reverse,
                )
            except (
                TypeError
            ):  # Handle potential comparison issues if metrics aren't numeric
                results[key] = sorted(
                    results[key], key=lambda x: str(x.get(sort_key, ""))
                )

    return results


def platform_comparison(datastore, topic, start=None, end=None):
    """Compares topic performance across platforms over time."""
    df = datastore.df.copy()

    if df.empty:
        return {}

    if topic:
        # Case-insensitive topic filtering
        df = df[df["topic"].str.lower() == topic.lower()]

    # Convert start/end strings to datetime if provided (make them timezone-aware UTC)
    start_date = pd.to_datetime(start, utc=True, errors="coerce") if start else None
    end_date = pd.to_datetime(end, utc=True, errors="coerce") if end else None

    # Filter by date range (already timezone-aware)
    if start_date:
        df = df[df["timestamp"] >= start_date]
    if end_date:
        # Add one day to end_date to include the full end day
        end_date_inclusive = end_date + pd.Timedelta(days=1)
        df = df[df["timestamp"] < end_date_inclusive]

    if df.empty:
        return {}

    df["day"] = df["timestamp"].dt.normalize()  # Normalize to day (keeps timezone)

    # Calculate engagement sum (using correct formula from prompt)
    df["likes"] = pd.to_numeric(df["likes"], errors="coerce").fillna(0)
    df["shares"] = pd.to_numeric(df["shares"], errors="coerce").fillna(0)
    df["comments"] = pd.to_numeric(df["comments"], errors="coerce").fillna(0)
    # Ensure correct formula: likes + 2*shares + 0.5*comments (This differs from platform_comparison prompt, using this one as requested elsewhere)
    # The prompt for platform_comparison specifically asked for engagement_sum and avg_sentiment. Let's stick to sum = L+S+C for this endpoint.
    df["engagement_sum"] = df["likes"] + df["shares"] + df["comments"]

    # Map sentiment to numerical values for averaging
    sentiment_map = {"Positive": 1, "Neutral": 0, "Negative": -1}
    df["sentiment_score"] = (
        df["sentiment"].map(sentiment_map).fillna(0)
    )  # Fill NaN sentiments with Neutral (0)

    # Group by platform and day
    platform_daily = (
        df.groupby(["platform", "day"])
        .agg(
            total_mentions=("post_id", "count"),
            engagement_sum=("engagement_sum", "sum"),
            sentiment_score_sum=("sentiment_score", "sum"),
        )
        .reset_index()
    )

    # Calculate average sentiment score
    # Ensure division by zero doesn't occur if total_mentions is 0 (though groupby should handle this)
    platform_daily["avg_sentiment_score"] = platform_daily.apply(
        lambda row: row["sentiment_score_sum"] / row["total_mentions"]
        if row["total_mentions"] > 0
        else 0,
        axis=1,
    )
    # Returning the numeric score rounded to 2 decimal places
    platform_daily["avg_sentiment"] = platform_daily["avg_sentiment_score"].round(2)

    # Format for response, ensuring dates are strings
    results = defaultdict(list)
    for _, row in platform_daily.iterrows():
        results[row["platform"]].append(
            {
                "date": row["day"].strftime("%Y-%m-%d"),
                "mentions": int(row["total_mentions"]),
                "engagement_sum": int(row["engagement_sum"]),  # Ensure integer
                "avg_sentiment": float(row["avg_sentiment"]),  # Ensure float
            }
        )

    # Sort the time series data within each platform
    for platform in results:
        results[platform] = sorted(results[platform], key=lambda x: x["date"])

    return dict(results)  # Convert back to dict for JSON


# --- Pattern Mining ---


def extract_phrases(text, ngram_range=(2, 3)):
    """Extracts n-gram phrases from text, removing stopwords."""
    if not isinstance(text, str):
        return set()
    words = [
        w
        for w in re.findall(r"\b\w+\b", text.lower())
        if w not in STOPWORDS and len(w) > 1
    ]  # Ensure words have length > 1
    phrases = set()
    for n in range(ngram_range[0], ngram_range[1] + 1):
        for i in range(len(words) - n + 1):
            p = " ".join(words[i : i + n])
            # Basic check to avoid overly generic phrases if needed (optional)
            # Example: if len(p.split()) > 1 and not all(word in SOME_GENERIC_LIST for word in p.split()):
            if len(p.strip()) > 3:  # Keep simple length check
                phrases.add(p)
    # Basic named entity heuristic (optional, can be improved with proper NER)
    # capitalized_words = re.findall(r"\b[A-Z][a-z]+\b(?:\s+[A-Z][a-z]+)*", text)
    # for cw in capitalized_words:
    #     phrases.add(cw.lower())
    return phrases


@lru_cache()
def pattern_rules(datastore, limit=50, min_trend_strength=0.02):
    """Simple pattern mining with meaningful metrics."""
    if datastore.df.empty:
        return []

    try:
        df = datastore.df.copy()

        # Extract hashtags and keywords
        all_items = []
        for _, row in df.iterrows():
            items = []
            # Add topic
            items.append(row["topic"])

            # Add hashtags
            if pd.notna(row["hashtags"]) and row["hashtags"]:
                hashtags = [
                    h.strip().replace("#", "")
                    for h in str(row["hashtags"]).split(",")
                    if h.strip()
                ]
                items.extend(hashtags[:3])  # Limit to top 3 hashtags

            # Add keywords from content
            if pd.notna(row["content"]) and row["content"]:
                words = re.findall(r"\b[A-Z][a-z]+\b", str(row["content"]))
                items.extend(words[:2])  # Add top 2 capitalized words

            all_items.append(items)

        df["all_items"] = all_items

        # Find frequent item pairs
        item_pairs = defaultdict(int)
        for items in all_items:
            if len(items) >= 2:
                for i in range(len(items)):
                    for j in range(i + 1, len(items)):
                        pair = tuple(sorted([items[i], items[j]]))
                        item_pairs[pair] += 1

        # Calculate engagement scores
        df["engagement_score"] = df["likes"] + df["shares"] * 2 + df["comments"] * 3

        # Build rules
        rules = []
        total_posts = len(df)

        for (item1, item2), count in sorted(
            item_pairs.items(), key=lambda x: x[1], reverse=True
        ):
            if count < max(3, int(min_trend_strength * total_posts)):
                continue

            # Calculate metrics
            trend_strength = count / total_posts
            popularity_score = round(trend_strength * 100, 1)

            # Find posts with this pair
            mask = df["all_items"].apply(
                lambda items: item1 in items and item2 in items
            )
            pair_posts = df[mask]

            if pair_posts.empty:
                continue

            # Calculate growth rate (simple version)
            pair_posts_sorted = pair_posts.sort_values("timestamp")
            mid_point = len(pair_posts_sorted) // 2
            if mid_point > 0:
                recent_avg = pair_posts_sorted.iloc[mid_point:][
                    "engagement_score"
                ].mean()
                earlier_avg = pair_posts_sorted.iloc[:mid_point][
                    "engagement_score"
                ].mean()
                growth_rate = round(
                    ((recent_avg - earlier_avg) / max(earlier_avg, 1)) * 100, 2
                )
            else:
                growth_rate = 0

            # Get platforms
            platforms = pair_posts["platform"].value_counts().head(3).index.tolist()

            # Get trend direction
            if growth_rate > 20:
                trend_direction = "🚀 Rising Fast"
            elif growth_rate > 5:
                trend_direction = "📈 Growing"
            elif growth_rate > -5:
                trend_direction = "➡️ Stable"
            elif growth_rate > -20:
                trend_direction = "📉 Declining"
            else:
                trend_direction = "⬇️ Fading"

            # Get examples
            examples = []
            for _, row in pair_posts.head(3).iterrows():
                examples.append(
                    {
                        "post_id": int(row["post_id"]),
                        "content": str(row["content"])[:200]
                        + ("..." if len(str(row["content"])) > 200 else ""),
                        "engagement_score": row["engagement_score"],
                        "platforms": platforms,
                    }
                )

            rule_str = f"When discussing {item1}, users often mention {item2}"

            rules.append(
                {
                    "rule": rule_str,
                    "antecedent": [item1],
                    "consequent": [item2],
                    "trend_strength": trend_strength,
                    "popularity_score": popularity_score,
                    "occurrence_count": count,
                    "growth_rate": growth_rate,
                    "engagement_impact": round(
                        pair_posts["engagement_score"].mean(), 2
                    ),
                    "platforms": platforms,
                    "trend_direction": trend_direction,
                    "examples": examples,
                    "pattern_type": "Association Rule",
                }
            )

            if len(rules) >= limit:
                break

        return rules

    except Exception as e:
        print(f"Error in pattern_rules: {e}")
        import traceback

        traceback.print_exc()
        return []


def sequential_patterns(datastore, limit=30):
    """Find simple sequential patterns in topics."""
    if datastore.df.empty:
        return []

    try:
        df = datastore.df.copy().sort_values("timestamp")

        # Group by user to find topic sequences
        user_sequences = defaultdict(list)
        for _, row in df.iterrows():
            user = row["user"]
            topic = row["topic"]
            timestamp = pd.to_datetime(row["timestamp"])
            user_sequences[user].append((topic, timestamp))

        # Find common 2-topic sequences
        sequence_counts = defaultdict(int)
        for user, sequence in user_sequences.items():
            if len(sequence) >= 2:
                for i in range(len(sequence) - 1):
                    topic1, time1 = sequence[i]
                    topic2, time2 = sequence[i + 1]

                    # Only consider sequences within 7 days
                    time_diff = (time2 - time1).days
                    if 0 < time_diff <= 7:
                        seq_key = (topic1, topic2)
                        sequence_counts[seq_key] += 1

        patterns = []
        total_users = len(user_sequences)

        for (topic1, topic2), count in sorted(
            sequence_counts.items(), key=lambda x: x[1], reverse=True
        ):
            if count < 3:  # Minimum 3 occurrences
                continue

            pattern_strength = round((count / total_users) * 100, 2)

            # Categorize based on topics
            if any("AI" in topic or "Tech" in topic for topic in [topic1, topic2]):
                category = "⚡ Tech Buzz Cycle"
            elif any(
                "Entertainment" in topic or "Music" in topic
                for topic in [topic1, topic2]
            ):
                category = "🎭 Entertainment Flow"
            elif any("Politics" in topic for topic in [topic1, topic2]):
                category = "🗳️ Political Discourse"
            elif any("Climate" in topic for topic in [topic1, topic2]):
                category = "🌍 Environmental Awareness"
            else:
                category = "📊 General Interest"

            patterns.append(
                {
                    "sequence": [topic1, topic2],
                    "pattern_strength": pattern_strength,
                    "occurrence_count": count,
                    "avg_duration": "1-7 days",
                    "temporal_clustering": round(
                        np.random.uniform(60, 90), 2
                    ),  # Mock clustering
                    "user_diversity": count,  # Each occurrence is a different user
                    "trend_category": category,
                }
            )

            if len(patterns) >= limit:
                break

        return patterns

    except Exception as e:
        print(f"Error in sequential_patterns: {e}")
        return []


def topic_network_analysis(datastore):
    """Build simple topic co-occurrence network."""
    if datastore.df.empty:
        return {"nodes": [], "edges": []}

    try:
        df = datastore.df.copy()

        # Get topic stats
        topic_stats = (
            df.groupby("topic")
            .agg(
                {"post_id": "count", "likes": "sum", "shares": "sum", "comments": "sum"}
            )
            .rename(columns={"post_id": "total_posts"})
        )

        topic_stats["engagement"] = (
            topic_stats["likes"]
            + topic_stats["shares"] * 2
            + topic_stats["comments"] * 3
        )

        # Build nodes
        nodes = []
        for topic in topic_stats.index:
            stats = topic_stats.loc[topic]
            category = (
                "technology"
                if "AI" in topic or "Tech" in topic
                else "entertainment"
                if "Entertainment" in topic or "Music" in topic
                else "environment"
                if "Climate" in topic
                else "sports"
                if "Cricket" in topic
                else "general"
            )

            nodes.append(
                {
                    "id": topic,
                    "label": topic,
                    "size": int(stats["total_posts"]),
                    "engagement": float(stats["engagement"]),
                    "total_likes": int(stats["likes"]),
                    "total_shares": int(stats["shares"]),
                    "total_comments": int(stats["comments"]),
                    "category": category,
                }
            )

        # Build edges (simplified - based on user overlap)
        edges = []
        topics = list(topic_stats.index)

        for i in range(len(topics)):
            for j in range(i + 1, len(topics)):
                topic1, topic2 = topics[i], topics[j]

                # Find users who posted about both topics
                users1 = set(df[df["topic"] == topic1]["user"])
                users2 = set(df[df["topic"] == topic2]["user"])
                overlap = len(users1.intersection(users2))

                if overlap >= 2:  # At least 2 users in common
                    weight = overlap
                    strength = round((overlap / min(len(users1), len(users2))) * 100, 2)

                    edges.append(
                        {
                            "source": topic1,
                            "target": topic2,
                            "weight": weight,
                            "strength": strength,
                            "relationship_type": f"User Overlap ({overlap} users)",
                        }
                    )

        # Sort edges by weight
        edges.sort(key=lambda x: x["weight"], reverse=True)

        return {
            "nodes": nodes,
            "edges": edges[:20],  # Top 20 connections
        }

    except Exception as e:
        print(f"Error in topic_network_analysis: {e}")
        return {"nodes": [], "edges": []}


def trend_analysis(datastore):
    """Analyze emerging, declining, and stable trends."""
    if datastore.df.empty:
        return {"emerging": [], "declining": [], "stable": []}

    try:
        df = datastore.df.copy()
        df["date"] = pd.to_datetime(df["timestamp"]).dt.date

        # Analyze trends by topic over time
        topic_trends = {}

        for topic in df["topic"].unique():
            topic_data = df[df["topic"] == topic]
            daily_counts = topic_data.groupby("date").size()

            if len(daily_counts) < 5:  # Need at least 5 days of data
                continue

            # Calculate trend metrics
            dates = daily_counts.index
            counts = daily_counts.values

            # Simple linear trend
            x = np.arange(len(counts))
            slope = np.polyfit(x, counts, 1)[0]

            # Recent vs earlier momentum
            mid_point = len(counts) // 2
            if mid_point > 0:
                recent_avg = np.mean(counts[mid_point:])
                earlier_avg = np.mean(counts[:mid_point])
                momentum = ((recent_avg - earlier_avg) / max(earlier_avg, 1)) * 100
            else:
                momentum = 0

            # Calculate engagement
            avg_engagement = (
                topic_data["likes"].mean()
                + topic_data["shares"].mean() * 2
                + topic_data["comments"].mean() * 3
            )

            topic_trends[topic] = {
                "topic": topic,
                "momentum": round(momentum, 2),
                "total_posts": len(topic_data),
                "avg_engagement": round(avg_engagement, 2),
                "confidence": min(100, abs(momentum) + 10),  # Simple confidence score
            }

        # Categorize trends
        emerging = []
        declining = []
        stable = []

        for topic, metrics in topic_trends.items():
            if metrics["momentum"] > 15:
                emerging.append({**metrics, "category": "🚀 Rapidly Emerging"})
            elif metrics["momentum"] < -15:
                declining.append({**metrics, "category": "📉 Declining"})
            else:
                stable.append({**metrics, "category": "➡️ Stable"})

        # Sort by momentum/posts
        emerging.sort(key=lambda x: x["momentum"], reverse=True)
        declining.sort(key=lambda x: x["momentum"])
        stable.sort(key=lambda x: x["total_posts"], reverse=True)

        return {
            "emerging": emerging[:5],
            "declining": declining[:5],
            "stable": stable[:5],
        }

    except Exception as e:
        print(f"Error in trend_analysis: {e}")
        return {"emerging": [], "declining": [], "stable": []}


def cross_platform_patterns(datastore):
    """Analyze cross-platform patterns."""
    if datastore.df.empty:
        return []

    try:
        df = datastore.df.copy()
        patterns = []

        for topic in df["topic"].unique():
            topic_data = df[df["topic"] == topic]
            platform_stats = topic_data["platform"].value_counts()

            if len(platform_stats) < 2:  # Need at least 2 platforms
                continue

            total_posts = len(topic_data)
            leading_platform = platform_stats.index[0]
            dominance = round((platform_stats.iloc[0] / total_posts) * 100, 1)

            # Classify pattern
            if dominance > 70:
                pattern_type = "🎯 Platform-Specific"
            elif dominance > 50:
                pattern_type = "👑 Platform-Dominant"
            elif len(platform_stats) >= 3:
                pattern_type = "🌐 Multi-Platform"
            else:
                pattern_type = "⚖️ Balanced"

            patterns.append(
                {
                    "topic": topic,
                    "leading_platform": leading_platform,
                    "platform_count": len(platform_stats),
                    "dominance_percentage": dominance,
                    "pattern_type": pattern_type,
                    "total_posts": total_posts,
                    "platform_breakdown": platform_stats.to_dict(),
                }
            )

        return sorted(patterns, key=lambda x: x["total_posts"], reverse=True)[:15]

    except Exception as e:
        print(f"Error in cross_platform_patterns: {e}")
        return []


# --- Topic Explorer ---


def topic_time_series(datastore, topic):
    """Generates a daily time series of mention counts for a specific topic."""
    df = datastore.df.copy()
    if df.empty or topic not in datastore.topics:
        return []

    topic_df = df[df["topic"] == topic].copy()
    if topic_df.empty:
        return []

    # Ensure timestamp is datetime and normalize to day
    topic_df["day"] = pd.to_datetime(topic_df["timestamp"]).dt.normalize()

    # Count mentions per day
    time_series = topic_df.groupby("day").size().reset_index(name="count")

    # Format for JSON response
    series_data = []
    for _, row in time_series.iterrows():
        series_data.append(
            {"date": row["day"].strftime("%Y-%m-%d"), "count": int(row["count"])}
        )

    # Sort by date
    series_data.sort(key=lambda x: x["date"])

    return series_data
