import pandas as pd
from dateutil import parser
import os
from collections import defaultdict
from functools import lru_cache
import schedule
import time
import threading


class DataStore:
    def __init__(self, csv_path="frontend/public/data/mock_social_trends_5000.csv"):
        self.csv_path = csv_path
        self._load()
        self._schedule_refresh()

    @lru_cache(maxsize=None)
    def _load(self):
        """Loads and preprocesses the CSV data."""
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"CSV not found at {self.csv_path}")

        df = pd.read_csv(self.csv_path)
        # Normalize column names (strip whitespace)
        df.columns = [c.strip() for c in df.columns]
        # Ensure timestamp is parsed as UTC datetime objects
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
        # Fill missing text values
        df["content"] = df["content"].fillna("")
        df["hashtags"] = df["hashtags"].fillna("")
        df["topic"] = df["topic"].fillna("Unknown")

        # Add preprocessing for pattern mining
        self._preprocess_for_pattern_mining(df)

        self.df = df

        # Build topics summary
        self._build_topic_tables()

    def _build_topic_tables(self):
        """Builds summary tables for topics."""
        if self.df.empty:
            self.topics = {}
            self.topic_mentions = defaultdict(list)
            return

        topics = self.df["topic"].unique().tolist()
        self.topics = {
            t: {
                "total_mentions": int((self.df["topic"] == t).sum()),
                "last_updated": self.df[self.df["topic"] == t]["timestamp"].max(),
            }
            for t in topics
        }
        # Topic mentions for time series analysis
        self.topic_mentions = defaultdict(list)
        for _, row in self.df.iterrows():
            self.topic_mentions[row["topic"]].append(row["timestamp"])

    def refresh(self):
        """Reloads the data from the CSV and clears caches."""
        print("Refreshing data store...")
        self._load.cache_clear()  # Clear the cache to force a reload
        self._load()
        print("Data store refreshed.")

    def _schedule_refresh(self):
        """Schedules the data refresh to run periodically."""
        schedule.every(24).hours.do(self.refresh)

        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(1)

        # Run the scheduler in a separate thread
        thread = threading.Thread(target=run_scheduler)
        thread.daemon = True
        thread.start()

    def _preprocess_for_pattern_mining(self, df):
        """Add preprocessing columns needed for pattern mining"""
        # Extract hashtags into lists
        df["hashtag_list"] = df["hashtags"].apply(self._extract_hashtags)

        # Extract keywords from content
        df["content_keywords"] = df["content"].apply(self._extract_keywords)

        # Combine hashtags, keywords, and topic for itemset analysis
        df["all_items"] = df.apply(
            lambda row: list(
                set(row["hashtag_list"] + row["content_keywords"] + [row["topic"]])
            ),
            axis=1,
        )

        # Ensure likes, shares, and comments are numeric
        for col in ["likes", "shares", "comments"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Fill NaN values with 0 to avoid float/string mix errors
        df[["likes", "shares", "comments"]] = df[["likes", "shares", "comments"]].fillna(0)

        # Calculate engagement score safely
        df["engagement_score"] = df["likes"] + df["shares"] * 2 + df["comments"] * 3


        # Add time-based features
        df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
        df["day_of_week"] = pd.to_datetime(df["timestamp"]).dt.dayofweek
        df["week"] = pd.to_datetime(df["timestamp"]).dt.isocalendar().week

    def _extract_hashtags(self, hashtag_str):
        """Extract hashtags from hashtag string"""
        if pd.isna(hashtag_str) or hashtag_str == "":
            return []
        hashtags = hashtag_str.split(",")
        return [tag.strip().replace("#", "") for tag in hashtags if tag.strip()]

    def _extract_keywords(self, content):
        """Extract keywords from content using simple NLP"""
        if pd.isna(content) or content == "":
            return []

        import re
        from collections import Counter

        # Remove common words and extract meaningful terms
        stop_words = {
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "could",
            "should",
            "this",
            "that",
            "these",
            "those",
            "i",
            "you",
            "he",
            "she",
            "it",
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
            "its",
            "our",
            "their",
            "new",
            "get",
            "go",
            "can",
            "like",
            "just",
            "now",
            "see",
            "know",
            "think",
            "want",
            "need",
            "come",
            "take",
            "make",
            "say",
            "said",
        }

        words = re.findall(r"\b[A-Za-z]{3,}\b", content.lower())
        keywords = [word.title() for word in words if word not in stop_words]

        # Keep only top keywords by frequency in content
        word_counts = Counter(keywords)
        return [word for word, count in word_counts.most_common(5)]
