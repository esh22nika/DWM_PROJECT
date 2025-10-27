import pandas as pd
import numpy as np
from collections import defaultdict, Counter
from itertools import combinations
import re
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Set, Any
import warnings

warnings.filterwarnings("ignore")


class PatternMiner:
    def __init__(self, datastore):
        self.datastore = datastore
        self.df = datastore.df.copy()
        if not self.df.empty:
            self._preprocess_data()

    def _preprocess_data(self):
        """Preprocess data for pattern mining"""
        # Extract hashtags and clean them
        self.df["hashtag_list"] = self.df["hashtags"].apply(self._extract_hashtags)

        # Extract keywords from content
        self.df["content_keywords"] = self.df["content"].apply(self._extract_keywords)

        # Combine hashtags and keywords for itemset analysis
        self.df["all_items"] = self.df.apply(
            lambda row: list(
                set(row["hashtag_list"] + row["content_keywords"] + [row["topic"]])
            ),
            axis=1,
        )

        # Calculate engagement score
        self.df["engagement_score"] = (
            self.df["likes"] + self.df["shares"] * 2 + self.df["comments"] * 3
        )

        # Add time-based features
        self.df["hour"] = pd.to_datetime(self.df["timestamp"]).dt.hour
        self.df["day_of_week"] = pd.to_datetime(self.df["timestamp"]).dt.dayofweek
        self.df["week"] = pd.to_datetime(self.df["timestamp"]).dt.isocalendar().week

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


class AprioriAlgorithm:
    def __init__(self, pattern_miner: PatternMiner, min_trend_strength=0.02):
        self.pattern_miner = pattern_miner
        self.df = pattern_miner.df
        self.min_trend_strength = min_trend_strength

    def find_frequent_itemsets(self) -> List[Dict]:
        """Find frequent itemsets using Apriori algorithm"""
        if self.df.empty:
            return []

        # Get all transactions (posts with their items)
        transactions = []
        for _, row in self.df.iterrows():
            items = row["all_items"]
            if items and len(items) > 0:
                transactions.append(set(items))

        if not transactions:
            return []

        total_transactions = len(transactions)
        min_support_count = max(1, int(self.min_trend_strength * total_transactions))

        # Find frequent 1-itemsets
        item_counts = Counter()
        for transaction in transactions:
            for item in transaction:
                item_counts[item] += 1

        frequent_itemsets = []

        # 1-itemsets
        frequent_1_items = {
            frozenset([item]): count
            for item, count in item_counts.items()
            if count >= min_support_count
        }

        for itemset, count in frequent_1_items.items():
            trend_strength = self._calculate_trend_strength(
                itemset, count, total_transactions
            )
            growth_rate = self._calculate_growth_rate(itemset)
            engagement_impact = self._calculate_engagement_impact(itemset)

            frequent_itemsets.append(
                {
                    "itemset": list(itemset),
                    "trend_strength": trend_strength,
                    "popularity_score": round(trend_strength * 100, 1),
                    "occurrence_count": count,
                    "growth_rate": growth_rate,
                    "engagement_impact": engagement_impact,
                    "platforms": self._get_platforms_for_itemset(itemset),
                    "trend_direction": self._get_trend_direction(growth_rate),
                }
            )

        # Generate 2-itemsets and beyond
        k = 2
        current_frequent = frequent_1_items

        while current_frequent and k <= 4:  # Limit to 4-itemsets for performance
            candidates = self._generate_candidates(current_frequent, k)
            current_frequent = {}

            for candidate in candidates:
                count = sum(
                    1 for transaction in transactions if candidate.issubset(transaction)
                )
                if count >= min_support_count:
                    current_frequent[candidate] = count

                    trend_strength = self._calculate_trend_strength(
                        candidate, count, total_transactions
                    )
                    growth_rate = self._calculate_growth_rate(candidate)
                    engagement_impact = self._calculate_engagement_impact(candidate)

                    frequent_itemsets.append(
                        {
                            "itemset": list(candidate),
                            "trend_strength": trend_strength,
                            "popularity_score": round(trend_strength * 100, 1),
                            "occurrence_count": count,
                            "growth_rate": growth_rate,
                            "engagement_impact": engagement_impact,
                            "platforms": self._get_platforms_for_itemset(candidate),
                            "trend_direction": self._get_trend_direction(growth_rate),
                        }
                    )
            k += 1

        # Sort by trend strength
        frequent_itemsets.sort(key=lambda x: x["trend_strength"], reverse=True)
        return frequent_itemsets[:50]  # Return top 50

    def _generate_candidates(self, frequent_prev, k):
        """Generate candidate itemsets of size k"""
        items = set()
        for itemset in frequent_prev.keys():
            items.update(itemset)

        return [frozenset(combo) for combo in combinations(items, k)]

    def _calculate_trend_strength(self, itemset, count, total_transactions):
        """Calculate trend strength (normalized frequency)"""
        return count / total_transactions

    def _calculate_growth_rate(self, itemset):
        """Calculate growth rate over time"""
        if self.df.empty:
            return 0

        # Get posts containing all items in itemset
        mask = self.df["all_items"].apply(
            lambda items: all(item in items for item in itemset)
        )
        posts = self.df[mask].copy()

        if posts.empty:
            return 0

        posts["date"] = pd.to_datetime(posts["timestamp"]).dt.date
        daily_counts = posts.groupby("date").size()

        if len(daily_counts) < 2:
            return 0

        # Calculate growth rate between first and second half of time period
        mid_point = len(daily_counts) // 2
        first_half_avg = daily_counts.iloc[:mid_point].mean()
        second_half_avg = daily_counts.iloc[mid_point:].mean()

        if first_half_avg == 0:
            return 100 if second_half_avg > 0 else 0

        growth_rate = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        return round(growth_rate, 2)

    def _calculate_engagement_impact(self, itemset):
        """Calculate average engagement for posts containing itemset"""
        if self.df.empty:
            return 0

        mask = self.df["all_items"].apply(
            lambda items: all(item in items for item in itemset)
        )
        posts = self.df[mask]

        if posts.empty:
            return 0

        return round(posts["engagement_score"].mean(), 2)

    def _get_platforms_for_itemset(self, itemset):
        """Get platforms where itemset appears"""
        if self.df.empty:
            return []

        mask = self.df["all_items"].apply(
            lambda items: all(item in items for item in itemset)
        )
        posts = self.df[mask]

        if posts.empty:
            return []

        platform_counts = posts["platform"].value_counts()
        return platform_counts.head(3).index.tolist()

    def _get_trend_direction(self, growth_rate):
        """Determine trend direction based on growth rate"""
        if growth_rate > 20:
            return "🚀 Rising Fast"
        elif growth_rate > 5:
            return "📈 Growing"
        elif growth_rate > -5:
            return "➡️ Stable"
        elif growth_rate > -20:
            return "📉 Declining"
        else:
            return "⬇️ Fading"


class SequentialPatternMining:
    def __init__(self, pattern_miner: PatternMiner):
        self.pattern_miner = pattern_miner
        self.df = pattern_miner.df

    def find_sequential_patterns(self, min_support=0.01) -> List[Dict]:
        """Find sequential patterns in topics over time"""
        if self.df.empty:
            return []

        # Sort by timestamp
        df_sorted = self.df.sort_values("timestamp").copy()

        # Group by user to find sequences
        user_sequences = {}
        for _, row in df_sorted.iterrows():
            user = row["user"]
            topic = row["topic"]
            timestamp = pd.to_datetime(row["timestamp"])

            if user not in user_sequences:
                user_sequences[user] = []

            user_sequences[user].append((topic, timestamp))

        # Find common sequences
        sequence_patterns = defaultdict(list)

        for user, sequence in user_sequences.items():
            if len(sequence) < 2:
                continue

            # Generate sequences of length 2-4
            for seq_len in range(2, min(5, len(sequence) + 1)):
                for i in range(len(sequence) - seq_len + 1):
                    subseq = sequence[i : i + seq_len]
                    topics = [item[0] for item in subseq]

                    # Calculate duration
                    duration = subseq[-1][1] - subseq[0][1]

                    pattern_key = tuple(topics)
                    sequence_patterns[pattern_key].append(
                        {
                            "user": user,
                            "duration": duration.total_seconds() / 3600,  # hours
                            "timestamps": [item[1] for item in subseq],
                        }
                    )

        # Calculate pattern metrics
        total_users = len(user_sequences)
        min_support_count = max(1, int(min_support * total_users))

        patterns = []
        for pattern, occurrences in sequence_patterns.items():
            if len(occurrences) >= min_support_count:
                durations = [occ["duration"] for occ in occurrences]
                avg_duration = np.mean(durations)

                # Calculate trend strength
                trend_strength = len(occurrences) / total_users

                # Calculate temporal clustering
                temporal_cluster_strength = self._calculate_temporal_clustering(
                    occurrences
                )

                # Format duration
                duration_str = self._format_duration(avg_duration)

                patterns.append(
                    {
                        "sequence": list(pattern),
                        "pattern_strength": round(trend_strength * 100, 2),
                        "occurrence_count": len(occurrences),
                        "avg_duration": duration_str,
                        "temporal_clustering": temporal_cluster_strength,
                        "user_diversity": len(set(occ["user"] for occ in occurrences)),
                        "trend_category": self._categorize_sequence_trend(
                            pattern, avg_duration
                        ),
                    }
                )

        # Sort by pattern strength
        patterns.sort(key=lambda x: x["pattern_strength"], reverse=True)
        return patterns[:30]

    def _calculate_temporal_clustering(self, occurrences):
        """Calculate how clustered the pattern occurrences are in time"""
        if len(occurrences) < 2:
            return 0

        all_start_times = [occ["timestamps"][0] for occ in occurrences]
        all_start_times.sort()

        # Calculate variance in start times
        timestamps_numeric = [ts.timestamp() for ts in all_start_times]
        variance = np.var(timestamps_numeric)

        # Normalize to 0-100 scale (higher = more clustered)
        max_variance = (
            all_start_times[-1].timestamp() - all_start_times[0].timestamp()
        ) ** 2 / 4
        clustering_score = (
            max(0, 100 - (variance / max_variance * 100)) if max_variance > 0 else 100
        )

        return round(clustering_score, 2)

    def _format_duration(self, hours):
        """Format duration in human readable format"""
        if hours < 1:
            return f"{int(hours * 60)} minutes"
        elif hours < 24:
            return f"{int(hours)} hours"
        else:
            days = int(hours / 24)
            return f"{days} day{'s' if days != 1 else ''}"

    def _categorize_sequence_trend(self, pattern, avg_duration):
        """Categorize sequence based on topics and duration"""
        topics = set(pattern)

        if any("AI" in topic or "ML" in topic or "Tech" in topic for topic in topics):
            if avg_duration < 24:
                return "⚡ Tech Buzz Cycle"
            else:
                return "🔬 Tech Evolution"
        elif any("Entertainment" in topic or "Music" in topic for topic in topics):
            return "🎭 Entertainment Flow"
        elif any("Politics" in topic for topic in topics):
            return "🗳️ Political Discourse"
        elif any("Climate" in topic or "Environment" in topic for topic in topics):
            return "🌍 Environmental Awareness"
        else:
            return "📊 General Interest"


class TopicNetworkAnalyzer:
    def __init__(self, pattern_miner: PatternMiner):
        self.pattern_miner = pattern_miner
        self.df = pattern_miner.df

    def build_topic_network(self) -> Dict:
        """Build network graph of topic relationships"""
        if self.df.empty:
            return {"nodes": [], "edges": []}

        # Create topic co-occurrence matrix
        topic_pairs = defaultdict(int)

        # Group posts by user and find topic transitions
        user_topics = defaultdict(list)
        for _, row in self.df.iterrows():
            user_topics[row["user"]].append(row["topic"])

        # Count topic co-occurrences within user posts
        for user, topics in user_topics.items():
            unique_topics = list(set(topics))
            for i, topic1 in enumerate(unique_topics):
                for topic2 in unique_topics[i + 1 :]:
                    pair = tuple(sorted([topic1, topic2]))
                    topic_pairs[pair] += 1

        # Get topic metrics
        topic_stats = (
            self.df.groupby("topic")
            .agg(
                {
                    "post_id": "count",
                    "engagement_score": "mean",
                    "likes": "sum",
                    "shares": "sum",
                    "comments": "sum",
                }
            )
            .round(2)
        )

        # Build nodes
        nodes = []
        for topic in topic_stats.index:
            stats = topic_stats.loc[topic]
            nodes.append(
                {
                    "id": topic,
                    "label": topic,
                    "size": int(stats["post_id"]),
                    "engagement": float(stats["engagement_score"]),
                    "total_likes": int(stats["likes"]),
                    "total_shares": int(stats["shares"]),
                    "total_comments": int(stats["comments"]),
                    "category": self._categorize_topic(topic),
                }
            )

        # Build edges
        edges = []
        min_weight = 2  # Minimum co-occurrence threshold
        for (topic1, topic2), weight in topic_pairs.items():
            if weight >= min_weight:
                # Calculate relationship strength
                total_posts_1 = topic_stats.loc[topic1, "post_id"]
                total_posts_2 = topic_stats.loc[topic2, "post_id"]

                # Normalize weight by topic sizes
                normalized_weight = weight / min(total_posts_1, total_posts_2) * 100

                edges.append(
                    {
                        "source": topic1,
                        "target": topic2,
                        "weight": int(weight),
                        "strength": round(normalized_weight, 2),
                        "relationship_type": self._classify_relationship(
                            topic1, topic2
                        ),
                    }
                )

        return {
            "nodes": nodes,
            "edges": sorted(edges, key=lambda x: x["weight"], reverse=True)[:50],
        }

    def _categorize_topic(self, topic):
        """Categorize topics for visualization"""
        if "AI" in topic or "ML" in topic:
            return "technology"
        elif "Entertainment" in topic or "Music" in topic or "Bollywood" in topic:
            return "entertainment"
        elif "Climate" in topic or "Environment" in topic:
            return "environment"
        elif "Politics" in topic:
            return "politics"
        elif "Sports" in topic or "Cricket" in topic:
            return "sports"
        elif "Finance" in topic or "Crypto" in topic:
            return "finance"
        else:
            return "general"

    def _classify_relationship(self, topic1, topic2):
        """Classify the relationship between two topics"""
        categories = {
            "technology": ["AI", "ML", "Tech", "Gadgets"],
            "entertainment": ["Entertainment", "Music", "Bollywood"],
            "environment": ["Climate", "Environment"],
            "politics": ["Politics"],
            "sports": ["Sports", "Cricket"],
            "finance": ["Finance", "Crypto"],
        }

        def get_category(topic):
            for cat, keywords in categories.items():
                if any(keyword in topic for keyword in keywords):
                    return cat
            return "general"

        cat1 = get_category(topic1)
        cat2 = get_category(topic2)

        if cat1 == cat2:
            return f"Same Domain ({cat1})"
        else:
            return f"Cross-Domain ({cat1}-{cat2})"


class TrendAnalyzer:
    def __init__(self, pattern_miner: PatternMiner):
        self.pattern_miner = pattern_miner
        self.df = pattern_miner.df

    def analyze_emerging_declining_trends(self) -> Dict:
        """Identify emerging and declining trends"""
        if self.df.empty:
            return {"emerging": [], "declining": [], "stable": []}

        # Analyze trends by topic over time
        df_with_dates = self.df.copy()
        df_with_dates["date"] = pd.to_datetime(df_with_dates["timestamp"]).dt.date

        topic_trends = {}

        for topic in df_with_dates["topic"].unique():
            topic_data = df_with_dates[df_with_dates["topic"] == topic]

            # Group by date and calculate daily metrics
            daily_stats = topic_data.groupby("date").agg(
                {"post_id": "count", "engagement_score": "mean", "likes": "sum"}
            )

            if len(daily_stats) < 3:
                continue

            # Calculate trend metrics
            dates = daily_stats.index
            post_counts = daily_stats["post_id"].values

            # Linear regression to find trend
            x = np.arange(len(post_counts))
            slope = np.polyfit(x, post_counts, 1)[0]

            # Calculate recent momentum (last 30% vs previous 30%)
            recent_idx = int(len(post_counts) * 0.7)
            if recent_idx < len(post_counts) - 1:
                recent_avg = np.mean(post_counts[recent_idx:])
                previous_avg = np.mean(
                    post_counts[
                        max(0, recent_idx - int(len(post_counts) * 0.3)) : recent_idx
                    ]
                )
            else:
                recent_avg = previous_avg = np.mean(post_counts)

            momentum = (recent_avg - previous_avg) / max(previous_avg, 1) * 100

            # Calculate volatility
            volatility = np.std(post_counts) / max(np.mean(post_counts), 1)

            topic_trends[topic] = {
                "topic": topic,
                "trend_slope": slope,
                "momentum": momentum,
                "volatility": round(volatility, 3),
                "total_posts": int(topic_data["post_id"].count()),
                "avg_engagement": round(topic_data["engagement_score"].mean(), 2),
                "peak_day": dates[np.argmax(post_counts)].strftime("%Y-%m-%d"),
                "peak_posts": int(np.max(post_counts)),
            }

        # Categorize trends
        emerging = []
        declining = []
        stable = []

        for topic, metrics in topic_trends.items():
            if metrics["momentum"] > 15 and metrics["trend_slope"] > 0:
                emerging.append(
                    {
                        **metrics,
                        "category": "🚀 Rapidly Emerging",
                        "confidence": min(100, abs(metrics["momentum"])),
                    }
                )
            elif metrics["momentum"] < -15 and metrics["trend_slope"] < 0:
                declining.append(
                    {
                        **metrics,
                        "category": "📉 Declining",
                        "confidence": min(100, abs(metrics["momentum"])),
                    }
                )
            else:
                stable.append(
                    {
                        **metrics,
                        "category": "➡️ Stable",
                        "confidence": max(0, 100 - abs(metrics["momentum"])),
                    }
                )

        # Sort by confidence/momentum
        emerging.sort(key=lambda x: x["momentum"], reverse=True)
        declining.sort(key=lambda x: x["momentum"])
        stable.sort(key=lambda x: x["total_posts"], reverse=True)

        return {
            "emerging": emerging[:10],
            "declining": declining[:10],
            "stable": stable[:10],
        }

    def calculate_cross_platform_patterns(self) -> List[Dict]:
        """Analyze patterns across different platforms"""
        if self.df.empty:
            return []

        platform_patterns = []

        # Analyze topic distribution across platforms
        for topic in self.df["topic"].unique():
            topic_data = self.df[self.df["topic"] == topic]
            platform_stats = (
                topic_data.groupby("platform")
                .agg(
                    {
                        "post_id": "count",
                        "engagement_score": "mean",
                        "likes": "mean",
                        "shares": "mean",
                        "comments": "mean",
                    }
                )
                .round(2)
            )

            if len(platform_stats) < 2:
                continue

            # Find leading platform
            leading_platform = platform_stats["post_id"].idxmax()
            platform_diversity = len(platform_stats)

            # Calculate platform dominance
            total_posts = platform_stats["post_id"].sum()
            dominance = (
                platform_stats.loc[leading_platform, "post_id"] / total_posts * 100
            )

            pattern_type = self._classify_platform_pattern(
                dominance, platform_diversity
            )

            platform_patterns.append(
                {
                    "topic": topic,
                    "leading_platform": leading_platform,
                    "platform_count": platform_diversity,
                    "dominance_percentage": round(dominance, 1),
                    "pattern_type": pattern_type,
                    "total_posts": int(total_posts),
                    "platform_breakdown": platform_stats["post_id"].to_dict(),
                }
            )

        return sorted(platform_patterns, key=lambda x: x["total_posts"], reverse=True)

    def _classify_platform_pattern(self, dominance, diversity):
        """Classify cross-platform pattern"""
        if dominance > 70:
            return "🎯 Platform-Specific"
        elif dominance > 50:
            return "👑 Platform-Dominant"
        elif diversity >= 3:
            return "🌐 Multi-Platform"
        else:
            return "⚖️ Balanced"
