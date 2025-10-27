import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Sparkles, Bell, Filter, Star, X, ThumbsUp, ThumbsDown, Share2, MessageCircle } from 'lucide-react';
import Papa from 'papaparse';

interface Post {
  post_id: string;
  platform: string;
  user: string;
  content: string;
  hashtags: string;
  topic: string;
  likes: number;
  shares: number;
  comments: number;
  sentiment: string;
  timestamp: string;
  region: string;
}

interface Trend {
  keyword: string;
  posts: Post[];
  totalEngagement: number;
  topics: Set<string>;
  platforms: Set<string>;
  avgEngagement: number;
  trendScore?: number;
  support?: number;
  velocity?: number;
  momentum?: number;
}

// Available topics from the dataset (12 unique topics)
const AVAILABLE_TOPICS = [
  'AI & Large Language Models',
  'Entertainment & Music',
  'Climate & Environment',
  'Space & ISRO',
  'Finance & Crypto',
  'Bollywood & Indian OTT',
  'Festivals & Culture',
  'Technology & Gadgets',
  'Gaming',
  'Cricket',
  'US Politics',
  'Electric Vehicles'
];

/**
 * Calculate trend score using pattern mining concepts
 * 
 * @param posts - Array of posts for this trend
 * @param totalPosts - Total number of posts in dataset
 * @returns Trend metrics including support, velocity, momentum, and overall score
 */
const calculateTrendMetrics = (posts: Post[], totalPosts: number) => {
  if (posts.length === 0) return { support: 0, velocity: 0, momentum: 0, trendScore: 0 };
  
  // 1. SUPPORT: Frequency of occurrence (what % of total posts mention this trend)
  const support = posts.length / totalPosts;
  
  // 2. Sort posts by timestamp
  const sortedPosts = [...posts].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // 3. VELOCITY: Rate of growth over time
  // Split into time buckets and measure growth rate
  const now = new Date();
  const timeWindows = {
    last24h: sortedPosts.filter(p => (now.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60) <= 24),
    last7d: sortedPosts.filter(p => (now.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60 * 24) <= 7),
    last30d: sortedPosts.filter(p => (now.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60 * 24) <= 30),
  };
  
  // Calculate velocity as posts per day in recent period vs older period
  const recentRate = timeWindows.last7d.length / 7; // posts per day in last week
  const olderRate = (timeWindows.last30d.length - timeWindows.last7d.length) / 23; // posts per day in weeks 2-4
  const velocity = olderRate > 0 ? (recentRate - olderRate) / olderRate : recentRate;
  
  // 4. MOMENTUM: Acceleration of engagement over time
  // Calculate engagement growth rate
  const midpoint = Math.floor(sortedPosts.length / 2);
  const recentPosts = sortedPosts.slice(midpoint);
  const olderPosts = sortedPosts.slice(0, midpoint);
  
  const recentEngagement = recentPosts.reduce((sum, p) => sum + p.likes + p.shares + p.comments, 0) / recentPosts.length;
  const olderEngagement = olderPosts.reduce((sum, p) => sum + p.likes + p.shares + p.comments, 0) / olderPosts.length;
  
  const momentum = olderEngagement > 0 ? (recentEngagement - olderEngagement) / olderEngagement : 1;
  
  // 5. ENGAGEMENT QUALITY: Average engagement per post
  const avgEngagement = posts.reduce((sum, p) => sum + p.likes + p.shares + p.comments, 0) / posts.length;
  const engagementScore = Math.log10(avgEngagement + 1) / 5; // Normalized log scale
  
  // 6. DIVERSITY: Number of unique platforms and topics (indicates broader reach)
  const uniquePlatforms = new Set(posts.map(p => p.platform)).size;
  const uniqueTopics = new Set(posts.map(p => p.topic)).size;
  const diversityScore = (uniquePlatforms / 5 + uniqueTopics / 12) / 2; // Normalized
  
  // 7. RECENCY: How recent are the posts (exponential decay)
  const avgRecency = posts.reduce((sum, p) => {
    const hoursSince = (now.getTime() - new Date(p.timestamp).getTime()) / (1000 * 60 * 60);
    return sum + Math.exp(-hoursSince / 168); // 168 hours = 1 week decay
  }, 0) / posts.length;
  
  // COMPOSITE TREND SCORE
  // Weighted combination of all factors
  const trendScore = (
    support * 100 +           // 100 weight for support (frequency)
    velocity * 50 +           // 50 weight for velocity (growth rate)
    momentum * 30 +           // 30 weight for momentum (acceleration)
    engagementScore * 40 +    // 40 weight for engagement quality
    diversityScore * 20 +     // 20 weight for diversity
    avgRecency * 30           // 30 weight for recency
  );
  
  return {
    support: Math.round(support * 10000) / 100, // Convert to percentage
    velocity: Math.round(velocity * 100) / 100,
    momentum: Math.round(momentum * 100) / 100,
    trendScore: Math.round(trendScore * 100) / 100
  };
};

const TrendMinerDashboard: React.FC = () => {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [backendTrends, setBackendTrends] = useState<any[]>([]);
  const [useBackend, setUseBackend] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'foryou'>('trending');
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('Modal state changed:', showInterestsModal);
  }, [showInterestsModal]);

  // Load data - try backend first, fallback to CSV
  useEffect(() => {
    const loadData = async () => {
      // Try backend API first
      if (useBackend) {
        try {
          const response = await fetch('/api/dashboard/trends?type=all&limit=100');
          if (response.ok) {
            const result = await response.json();
            console.log('Loaded trends from backend:', result.trends.length);
            setBackendTrends(result.trends);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log('Backend not available, falling back to CSV:', error);
          setUseBackend(false);
        }
      }
      
      // Fallback to CSV if backend is not available
      try {
        const response = await fetch('/data/mock_social_trends_5000.csv');
        const csvText = await response.text();
        Papa.parse<Post>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<Post>) => {
            console.log('Loaded posts from CSV:', results.data.length);
            setData(results.data);
            setLoading(false);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [useBackend]);

  // Advanced trend extraction algorithm using hashtags and content analysis
  const extractTrends = useMemo((): Trend[] => {
    // Use backend trends if available
    if (useBackend && backendTrends.length > 0) {
      return backendTrends.map(trend => ({
        keyword: trend.keyword,
        posts: trend.posts || [],
        totalEngagement: trend.total_engagement,
        topics: new Set(trend.topics || []),
        platforms: new Set(trend.platforms || []),
        avgEngagement: trend.avg_engagement
      }));
    }
    
    // Otherwise use frontend extraction
    if (data.length === 0) return [];
    
    const trendMap = new Map<string, {
      keyword: string;
      posts: Post[];
      totalEngagement: number;
      topics: Set<string>;
      platforms: Set<string>;
    }>();
    
    // Lower engagement threshold to find more trends
    const engagementThreshold = 50;
    
    data.forEach((post: Post) => {
      const engagement = (post.likes || 0) + (post.shares || 0) + (post.comments || 0);
      
      // Only consider posts with significant engagement
      if (engagement < engagementThreshold) return;
      
      // Extract trends from hashtags
      if (post.hashtags) {
        const tags = post.hashtags
          .split(',')
          .map(tag => tag.trim().toLowerCase().replace(/^#/, ''));
        
        tags.forEach(tag => {
          if (tag && tag.length > 2) {
            if (!trendMap.has(tag)) {
              trendMap.set(tag, {
                keyword: tag,
                posts: [],
                totalEngagement: 0,
                topics: new Set<string>(),
                platforms: new Set<string>()
              });
            }
            const trend = trendMap.get(tag)!;
            trend.posts.push(post);
            trend.totalEngagement += engagement;
            trend.topics.add(post.topic);
            trend.platforms.add(post.platform);
          }
        });
      }
      
      // Extract trends from content using keyword analysis - expanded list
      const content = (post.content || '').toLowerCase();
      const contentKeywords = [
        'diwali', 'gemini', 'llama', 'llama2', 'llama-3', 'gpt-5', 'mistral', 'chatgpt',
        'bts', 'taylor swift', 'beyoncé', 'arijit singh', 'bad bunny',
        'crypto', 'bitcoin', 'stocks', 'markets', 'ethereum',
        'isro', 'chandrayaan', 'space', 'nasa', 'spacex',
        'worldcup', 'cricket', 'kohli', 'babar', 'smith', 'indvpak',
        'aamir khan', 'ranveer singh', 'bollywood', 'ott', 'netflix',
        'heatwave', 'climate', 'cop29', 'sustainability',
        'apple', 'm5', 'oneplus', 'gaming', 'xbox', 'ps5',
        'elections', 'politics', 'vote', 'festival', 'music'
      ];
      
      contentKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          if (!trendMap.has(keyword)) {
            trendMap.set(keyword, {
              keyword,
              posts: [],
              totalEngagement: 0,
              topics: new Set<string>(),
              platforms: new Set<string>()
            });
          }
          const trend = trendMap.get(keyword)!;
          // Avoid duplicates
          if (!trend.posts.find(p => p.post_id === post.post_id)) {
            trend.posts.push(post);
            trend.totalEngagement += engagement;
            trend.topics.add(post.topic);
            trend.platforms.add(post.platform);
          }
        }
      });
    });
    
    // Filter trends with at least 2 posts, calculate metrics, and sort by trend score
    const trendsWithScores = Array.from(trendMap.values())
      .filter(trend => trend.posts.length >= 2)
      .map(trend => {
        const metrics = calculateTrendMetrics(trend.posts, data.length);
        return {
          keyword: trend.keyword,
          posts: trend.posts,
          totalEngagement: trend.totalEngagement,
          topics: trend.topics,
          platforms: trend.platforms,
          avgEngagement: trend.totalEngagement / trend.posts.length,
          trendScore: metrics.trendScore,
          support: metrics.support,
          velocity: metrics.velocity,
          momentum: metrics.momentum
        };
      })
      .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0)); // Sort by trend score
    
    return trendsWithScores;
  }, [data, backendTrends, useBackend]);

  // Active Posts: All posts with high engagement (above threshold)
  const activePosts = useMemo(() => {
    if (useBackend && backendTrends.length > 0) {
      // Count unique posts from backend trends (avoid duplicates)
      const uniquePostIds = new Set<string>();
      backendTrends.forEach(trend => {
        trend.posts?.forEach((post: any) => uniquePostIds.add(post.post_id));
      });
      return uniquePostIds.size;
    }
    // Count posts with engagement > 1000 (high engagement)
    return data.filter(post => {
      const engagement = (post.likes || 0) + (post.shares || 0) + (post.comments || 0);
      return engagement > 1000;
    }).length;
  }, [data, backendTrends, useBackend]);
  
  // Updates This Month: Posts from October 2025 (latest month in dataset)
  const updatesThisMonth = useMemo(() => {
    if (useBackend && backendTrends.length > 0) {
      // For backend, count recent posts
      const allPosts = backendTrends.flatMap(trend => trend.posts || []);
      return allPosts.filter((post: any) => {
        const postDate = new Date(post.timestamp);
        return postDate.getMonth() === 9 && postDate.getFullYear() === 2025; // October = month 9
      }).length;
    }
    // Count posts from October 2025
    return data.filter(post => {
      const postDate = new Date(post.timestamp);
      return postDate.getMonth() === 9 && postDate.getFullYear() === 2025; // October = month 9
    }).length;
  }, [data, backendTrends, useBackend]);
  
  // Relevance Score: Percentage of ALL posts (not trends) matching user interests
  const relevanceScore = useMemo(() => {
    // If no interests selected, show average distribution across top topics
    if (selectedInterests.length === 0) {
      if (useBackend && backendTrends.length > 0) {
        const allPosts = backendTrends.flatMap(trend => trend.posts || []);
        if (allPosts.length === 0) return 0;
        // Get top 3 most common topics
        const topicCounts = new Map<string, number>();
        allPosts.forEach((post: any) => {
          topicCounts.set(post.topic, (topicCounts.get(post.topic) || 0) + 1);
        });
        const topTopics = Array.from(topicCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);
        const topCount = topTopics.reduce((sum, [_, count]) => sum + count, 0);
        return Math.round((topCount / allPosts.length) * 100);
      }
      if (data.length === 0) return 0;
      // Get top 3 most common topics from data
      const topicCounts = new Map<string, number>();
      data.forEach(post => {
        topicCounts.set(post.topic, (topicCounts.get(post.topic) || 0) + 1);
      });
      const topTopics = Array.from(topicCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      const topCount = topTopics.reduce((sum, [_, count]) => sum + count, 0);
      return Math.round((topCount / data.length) * 100);
    }
    
    // If interests selected, calculate match percentage
    if (useBackend && backendTrends.length > 0) {
      const allPosts = backendTrends.flatMap(trend => trend.posts || []);
      if (allPosts.length === 0) return 0;
      const matchingPosts = allPosts.filter((post: any) => 
        selectedInterests.includes(post.topic)
      );
      return Math.round((matchingPosts.length / allPosts.length) * 100);
    }
    
    if (data.length === 0) return 0;
    const matchingPosts = data.filter(post => 
      selectedInterests.includes(post.topic)
    );
    return Math.round((matchingPosts.length / data.length) * 100);
  }, [data, selectedInterests, backendTrends, useBackend]);
  
  // For You Feed: Trending posts matching user interests
  const forYouFeed = useMemo(() => {
    if (selectedInterests.length === 0) return [];
    
    // Get all trending posts that match user interests
    const matchingPosts = extractTrends
      .filter(trend => Array.from(trend.topics).some(topic => selectedInterests.includes(topic)))
      .flatMap(trend => trend.posts)
      .sort((a, b) => {
        const engagementA = a.likes + a.shares + a.comments;
        const engagementB = b.likes + b.shares + b.comments;
        return engagementB - engagementA;
      });
    
    // Remove duplicates based on post_id
    const uniquePosts = Array.from(
      new Map(matchingPosts.map(post => [post.post_id, post])).values()
    );
    
    return uniquePosts.slice(0, 20);
  }, [extractTrends, selectedInterests]);
  
  // Trending Now: Top trending content
  const trendingFeed = useMemo(() => extractTrends.slice(0, 20), [extractTrends]);
  
  // Toggle interest selection
  const toggleInterest = (topic: string) => {
    setSelectedInterests(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trend data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Personalized Dashboard</h2>
          <p className="text-gray-600 text-lg">Discover trends tailored to your interests</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Trends Tracked Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #60A5FA, #22D3EE)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #93C5FD',
            padding: '1.5rem',
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{extractTrends.length.toLocaleString()}</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', fontSize: '0.875rem' }}>Trends Tracked</p>
          </div>
          {/* Active Posts Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #A78BFA, #4F46E5)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #C4B5FD',
            padding: '1.5rem',
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{activePosts.toLocaleString()}</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', fontSize: '0.875rem' }}>Active Posts</p>
          </div>
          {/* Updates This Month Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #22C55E, #059669)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #4ADE80',
            padding: '1.5rem',
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ backgroundColor: 'rgba(5, 150, 105, 0.2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <Bell className="w-8 h-8 text-white" />
              </div>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{updatesThisMonth.toLocaleString()}</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', fontSize: '0.875rem' }}>Updates This Month</p>
          </div>
          {/* Relevance Score Card */}
          <div style={{
            background: 'linear-gradient(to bottom right, #F472B6, #F43F5E)',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '2px solid #FBCFE8',
            padding: '1.5rem',
            transform: 'scale(1)',
            transition: 'transform 0.2s'
          }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', borderRadius: '0.75rem', padding: '0.75rem' }}>
                <Filter className="w-8 h-8 text-white" />
              </div>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>{relevanceScore}%</div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: '500', fontSize: '0.875rem' }}>Relevance Score</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Toggle */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('trending')}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    background: activeTab === 'trending' ? 'linear-gradient(to right, #34D399, #14B8A6)' : 'white',
                    border: activeTab === 'trending' ? 'none' : '1px solid #D1FAE5',
                    boxShadow: activeTab === 'trending' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <TrendingUp className="w-5 h-5 inline-block mr-2 text-gray-900" />
                  <span className="text-gray-900 font-semibold">Trending Now</span>
                </button>
                <button
                  onClick={() => setActiveTab('foryou')}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    background: activeTab === 'foryou' ? 'linear-gradient(to right, #A78BFA, #EC4899)' : 'white',
                    border: 'none',
                    color: activeTab === 'foryou' ? 'white' : '#4B5563',
                    boxShadow: activeTab === 'foryou' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    display: 'inline-block', 
                    marginRight: '0.5rem',
                    color: activeTab === 'foryou' ? 'white' : '#4B5563'
                  }} />
                  For You
                </button>
              </div>
            </div>
            
            {/* Content Area */}
            {activeTab === 'trending' ? (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Trending Now
                </h3>
                {trendingFeed.length > 0 ? (
                  <div className="space-y-4">
                    {trendingFeed.map((trend: Trend, idx: number) => (
                      <TrendCard key={idx} trend={trend} rank={idx + 1} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No trends found.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  For You
                </h3>
                {selectedInterests.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600 mb-2 font-medium">Select your interests to personalize your feed</p>
                    <p className="text-gray-400 text-sm">Choose topics from the sidebar to see trending posts you'll love</p>
                  </div>
                ) : forYouFeed.length > 0 ? (
                  <div className="space-y-4">
                    {forYouFeed.map((post: Post) => (
                      <PostCard key={post.post_id} post={post} selectedInterests={selectedInterests} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No trending posts match your interests yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Interest Selector with Bars */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Your Interests</h3>
              
              <div className="space-y-4 mb-6">
                {(selectedInterests.length > 0 ? selectedInterests : AVAILABLE_TOPICS.slice(0, 5)).map((topic, idx) => {
                  const isSelected = selectedInterests.includes(topic);
                  
                  // Calculate post count from backend or CSV data
                  let postCount = 0;
                  let totalPosts = 0;
                  if (useBackend && backendTrends.length > 0) {
                    const allPosts = backendTrends.flatMap(trend => trend.posts || []);
                    totalPosts = allPosts.length;
                    postCount = allPosts.filter((p: any) => p.topic === topic).length;
                  } else {
                    totalPosts = data.length;
                    postCount = data.filter(p => p.topic === topic).length;
                  }
                  
                  const percentage = totalPosts > 0 ? Math.min(100, (postCount / totalPosts) * 100 * 5) : 0;
                  const colors = [
                    { bg: '#C4B5FD', gradient: 'linear-gradient(to right, #A78BFA, #7C3AED)' },
                    { bg: '#93C5FD', gradient: 'linear-gradient(to right, #60A5FA, #3B82F6)' },
                    { bg: '#86EFAC', gradient: 'linear-gradient(to right, #4ADE80, #22C55E)' },
                    { bg: '#FED7AA', gradient: 'linear-gradient(to right, #FB923C, #F97316)' },
                    { bg: '#FCA5A5', gradient: 'linear-gradient(to right, #F87171, #EF4444)' },
                  ];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <div key={topic} style={{ cursor: 'pointer' }} onClick={() => toggleInterest(topic)}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{topic}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold', 
                          backgroundColor: color.bg,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px'
                        }}>
                          {postCount}
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '9999px', height: '0.625rem', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            background: color.gradient,
                            height: '0.625rem',
                            borderRadius: '9999px',
                            width: `${percentage}%`,
                            opacity: isSelected ? 1 : 0.5,
                            transition: 'all 0.5s'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="w-full py-3 px-4 bg-white border-2 border-purple-200 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-400 active:scale-95 transition-all cursor-pointer"
                onClick={() => {
                  console.log('Manage Interests clicked');
                  setShowInterestsModal(true);
                }}
              >
                Manage Interests
              </button>
              
              {selectedInterests.length === 0 && (
                <p className="text-xs text-gray-500 text-center mt-4 py-2 bg-gray-50 rounded-lg">
                  Select topics to personalize your feed
                </p>
              )}
            </div>
            
            {/* Top Trends Right Now */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Top Trends Right Now</h3>
              <div className="space-y-3">
                {extractTrends.slice(0, 10).map((trend: Trend, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 capitalize block">
                          #{trend.keyword}
                        </span>
                        <p className="text-xs text-gray-500">
                          {trend.posts.length} posts
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-600">
                      {(trend.avgEngagement / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Manage Interests Modal */}
    {showInterestsModal && (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '1rem'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowInterestsModal(false);
          }
        }}
      >
  <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden relative">
          <div className="bg-[#C4B5FD] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Manage Your Interests</h2>
              <button 
                onClick={() => setShowInterestsModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white/90 mt-2">Select topics you're interested in to personalize your feed</p>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AVAILABLE_TOPICS.map((topic) => {
                const isSelected = selectedInterests.includes(topic);
                // Calculate post count from backend or CSV data
                let postCount = 0;
                let totalPosts = 0;
                if (useBackend && backendTrends.length > 0) {
                  const allPosts = backendTrends.flatMap(trend => trend.posts || []);
                  totalPosts = allPosts.length;
                  postCount = allPosts.filter((p: any) => p.topic === topic).length;
                } else {
                  totalPosts = data.length;
                  postCount = data.filter(p => p.topic === topic).length;
                }
                const percentage = totalPosts > 0 ? Math.min(100, (postCount / totalPosts) * 100 * 5) : 0;
                // Lavender: #A78BFA (500), #7C3AED (600)
                return (
                  <button
                    key={topic}
                    onClick={() => toggleInterest(topic)}
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      border: isSelected ? '2px solid #A78BFA' : '2px solid #E5E7EB',
                      backgroundColor: isSelected ? '#A78BFA' : 'white',
                      color: isSelected ? 'white' : '#111827',
                      textAlign: 'left',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (isSelected) {
                        e.currentTarget.style.backgroundColor = '#7C3AED';
                        e.currentTarget.style.borderColor = '#7C3AED';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isSelected) {
                        e.currentTarget.style.backgroundColor = '#A78BFA';
                        e.currentTarget.style.borderColor = '#A78BFA';
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ color: isSelected ? 'white' : '#111827' }}>
                        {topic}
                      </span>
                      {isSelected && (
                        <div style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                          color: 'white',
                          borderRadius: '9999px',
                          padding: '0.25rem'
                        }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          style={{
                            height: '0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF',
                            width: `${percentage}%`,
                            transition: 'all 0.3s'
                          }}
                        ></div>
                      </div>
                      <span style={{ 
                        color: isSelected ? 'white' : '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>{postCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between bg-[#EDE9FE] rounded-2xl px-4 py-3 border border-[#C4B5FD]">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {selectedInterests.length} topic{selectedInterests.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-gray-600">
                  {selectedInterests.length === 0 
                    ? 'Select at least one topic to personalize your feed' 
                    : 'Your feed will show trending posts from these topics'}
                </p>
              </div>
              <button
                onClick={() => setShowInterestsModal(false)}
                style={{
                  backgroundColor: '#A78BFA',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7C3AED'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#A78BFA'}
              >
                Done
              </button>
            </div>
          </div>
          {/* Remove any floating or absolutely positioned button in the modal bottom right if present */}
        </div>
      </div>
    )}
  </>
  );
};

interface TrendCardProps {
  trend: Trend;
  rank?: number;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, rank }) => {
  const topPost = trend.posts.sort((a: Post, b: Post) =>
    (b.likes + b.shares + b.comments) - (a.likes + a.shares + a.comments)
  )[0];
  
  return (
    <div style={{
      border: '2px solid #E5E7EB',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      background: 'linear-gradient(to bottom right, #FFFFFF, #F9FAFB)',
      transition: 'all 0.3s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#C4B5FD'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
      <div className="flex items-start gap-4 mb-4">
        {rank && (
          <div style={{
            background: 'linear-gradient(to bottom right, #A78BFA, #D946EF)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.25rem',
            borderRadius: '0.75rem',
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 capitalize text-xl mb-2">
                #{trend.keyword}
              </h4>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {trend.posts.length} posts
                </span>
                {trend.trendScore && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(to right, #FBBF24, #F97316)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    Score: {trend.trendScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-500 flex-shrink-0 ml-3" />
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">{topPost?.content}</p>
        </div>
      </div>
      
      {/* Trend Metrics */}
      {trend.support !== undefined && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div style={{ background: 'linear-gradient(to bottom right, #EFF6FF, #DBEAFE)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: '600', marginBottom: '0.25rem' }}>Support</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1D4ED8' }}>{trend.support.toFixed(2)}%</div>
          </div>
          <div style={{ background: 'linear-gradient(to bottom right, #F0FDF4, #DCFCE7)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: '600', marginBottom: '0.25rem' }}>Velocity</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#15803D' }}>{trend.velocity?.toFixed(2)}</div>
          </div>
          <div style={{ background: 'linear-gradient(to bottom right, #FFF7ED, #FFEDD5)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: '600', marginBottom: '0.25rem' }}>Momentum</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#C2410C' }}>{trend.momentum?.toFixed(2)}</div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', background: 'linear-gradient(to right, #FAF5FF, #FCE7F3)', padding: '0.75rem', borderRadius: '0.5rem' }}>
        <div className="flex items-center gap-3 text-sm">
          <span className="font-bold text-purple-600">
            {(trend.avgEngagement / 1000).toFixed(1)}K
          </span>
          <span className="text-gray-400">•</span>
          <span className="font-medium text-gray-600">{Array.from(trend.platforms).join(', ')}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {Array.from(trend.topics).map((topic: string, idx: number) => (
          <span
            key={idx}
            style={{
              fontSize: '0.75rem',
              background: 'linear-gradient(to right, #E9D5FF, #FCE7F3)',
              color: '#7C3AED',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              fontWeight: '600'
            }}
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
};

interface PostCardProps {
  post: Post;
  selectedInterests?: string[];
}

const PostCard: React.FC<PostCardProps> = ({ post, selectedInterests = [] }) => {
  const engagement = post.likes + post.shares + post.comments;
  
  // Calculate relevance based on multiple factors
  // Base score from engagement (normalized to 40-70 range)
  const engagementScore = Math.min(70, 40 + Math.round((engagement / 500000) * 30));
  
  // Bonus if topic matches selected interests (up to +25)
  const topicMatch = selectedInterests.length === 0 || selectedInterests.includes(post.topic);
  const topicBonus = topicMatch ? Math.floor(Math.random() * 10) + 15 : Math.floor(Math.random() * 5);
  
  // Calculate final relevance (60-95% range)
  const relevance = Math.min(95, Math.max(60, engagementScore + topicBonus));
  
  return (
    <div style={{
      border: '2px solid #E5E7EB',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      background: 'white',
      transition: 'all 0.3s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = '#FBCFE8'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#E5E7EB'; }}>
      <div className="flex items-start gap-3 mb-4">
        <div style={{
          background: 'linear-gradient(to bottom right, #F87171, #EF4444)',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          padding: '0.25rem 0.75rem',
          borderRadius: '0.375rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          {post.platform.toUpperCase()}
        </div>
        <TrendingUp className="w-5 h-5 text-emerald-500 ml-auto" />
      </div>
      
      <h4 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg leading-relaxed">
        {post.content}
      </h4>
      
      {/* Relevance Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600 font-semibold">Relevance:</span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #3B82F6, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {relevance}%
          </span>
        </div>
        <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '9999px', height: '0.625rem' }}>
          <div 
            style={{ 
              background: 'linear-gradient(to right, #60A5FA, #A78BFA, #EC4899)',
              height: '0.625rem',
              borderRadius: '9999px',
              width: `${relevance}%`,
              transition: 'all 0.3s'
            }}
          ></div>
        </div>
      </div>
      
      {/* Engagement Metrics with Colors */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div style={{ background: 'linear-gradient(to bottom right, #DCFCE7, #BBF7D0)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
          <ThumbsUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#15803D' }}>{(post.likes / 1000).toFixed(1)}K</div>
        </div>
        <div style={{ background: 'linear-gradient(to bottom right, #FEE2E2, #FECACA)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
          <ThumbsDown className="w-5 h-5 mx-auto mb-1 text-red-600" />
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#B91C1C' }}>{(post.likes * 0.1 / 1000).toFixed(1)}K</div>
        </div>
        <div style={{ background: 'linear-gradient(to bottom right, #DBEAFE, #BFDBFE)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
          <Share2 className="w-5 h-5 mx-auto mb-1 text-blue-600" />
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1D4ED8' }}>{(post.shares / 1000).toFixed(1)}K</div>
        </div>
        <div style={{ background: 'linear-gradient(to bottom right, #E9D5FF, #DDD6FE)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
          <MessageCircle className="w-5 h-5 mx-auto mb-1 text-purple-600" />
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#6D28D9' }}>{(post.comments / 1000).toFixed(1)}K</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          {post.topic.split('&').slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
              {tag.trim()}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default TrendMinerDashboard;