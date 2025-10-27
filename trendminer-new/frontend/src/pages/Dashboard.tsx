import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Sparkles, Bell, Filter, Star, X } from 'lucide-react';
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
}

// Available topics from the dataset
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
  'US Politics'
];

const TrendMinerDashboard: React.FC = () => {
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [backendTrends, setBackendTrends] = useState<any[]>([]);
  const [useBackend, setUseBackend] = useState(true);

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
    
    // Engagement threshold for considering a post as trending
    const engagementThreshold = 100;
    
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
      
      // Extract trends from content using keyword analysis
      const content = (post.content || '').toLowerCase();
      const contentKeywords = [
        'diwali', 'gemini', 'llama', 'llama2', 'llama-3', 'gpt-5', 'mistral',
        'bts', 'taylor swift', 'beyoncé', 'arijit singh', 'bad bunny',
        'crypto', 'bitcoin', 'stocks', 'markets',
        'isro', 'chandrayaan', 'space',
        'worldcup', 'cricket', 'kohli', 'babar', 'smith',
        'aamir khan', 'ranveer singh',
        'heatwave', 'climate', 'cop29', 'sustainability',
        'apple', 'm5', 'netflix', 'gaming', 'xbox', 'ps5',
        'elections', 'politics', 'vote'
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
          trend.posts.push(post);
          trend.totalEngagement += engagement;
          trend.topics.add(post.topic);
          trend.platforms.add(post.platform);
        }
      });
    });
    
    // Filter trends with at least 2 posts and sort by total engagement
    return Array.from(trendMap.values())
      .filter(trend => trend.posts.length >= 2)
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .map(trend => ({
        keyword: trend.keyword,
        posts: trend.posts,
        totalEngagement: trend.totalEngagement,
        topics: trend.topics,
        platforms: trend.platforms,
        avgEngagement: trend.totalEngagement / trend.posts.length
      }));
  }, [data, backendTrends, useBackend]);

  // Active Trends: Trends with high engagement (above threshold)
  const activeTrends = useMemo(() => 
    extractTrends.filter(trend => trend.avgEngagement > 1000), 
    [extractTrends]
  );
  
  // Recent Trends: Trends from the last month
  const recentTrends = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return extractTrends.filter(trend => 
      trend.posts.some((post: Post) => new Date(post.timestamp) >= oneMonthAgo)
    );
  }, [extractTrends]);
  
  // Relevance Score: Percentage of trends matching user interests
  const relevanceScore = useMemo(() => {
    if (selectedInterests.length === 0 || extractTrends.length === 0) return 0;
    const matchingTrends = extractTrends.filter(trend => 
      Array.from(trend.topics).some((topic: string) => selectedInterests.includes(topic))
    );
    return Math.round((matchingTrends.length / extractTrends.length) * 100);
  }, [extractTrends, selectedInterests]);
  
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Personalized Dashboard</h2>
          <p className="text-gray-600">Discover trends tailored to your interests</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-blue-600">{extractTrends.length}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Trends Tracked</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-purple-600">{activeTrends.length}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Active Trends</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-green-600">{recentTrends.length}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Updates Today</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-pink-100 rounded-lg p-3">
                <Filter className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-3xl font-bold text-pink-600">{relevanceScore}%</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Relevance Score</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* For You Section */}
            {selectedInterests.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  For You
                </h3>
                {forYouFeed.length > 0 ? (
                  <div className="space-y-4">
                    {forYouFeed.map((post: Post) => (
                      <PostCard key={post.post_id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No trending posts match your interests yet.
                  </div>
                )}
              </div>
            )}
            
            {/* Trending Now Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Trending Now
              </h3>
              {trendingFeed.length > 0 ? (
                <div className="space-y-4">
                  {trendingFeed.map((trend: Trend, idx: number) => (
                    <TrendCard key={idx} trend={trend} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">No trends found.</div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Interest Selector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Interests</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleInterest(topic)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedInterests.includes(topic)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {topic}
                    {selectedInterests.includes(topic) && (
                      <X className="inline-block w-3 h-3 ml-1" />
                    )}
                  </button>
                ))}
              </div>
              {selectedInterests.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  Select topics to personalize your feed
                </p>
              )}
            </div>
            
            {/* Top Trends Right Now */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Top Trends Right Now</h3>
              <div className="space-y-3">
                {extractTrends.slice(0, 10).map((trend: Trend, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        #{trend.keyword}
                      </span>
                      <p className="text-xs text-gray-500">
                        {trend.posts.length} posts
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-purple-600">
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
  );
};

interface TrendCardProps {
  trend: Trend;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const topPost = trend.posts.sort((a: Post, b: Post) =>
    (b.likes + b.shares + b.comments) - (a.likes + a.shares + a.comments)
  )[0];
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 capitalize mb-1 flex items-center gap-2">
            #{trend.keyword}
            <span className="text-xs font-normal text-gray-500">
              ({trend.posts.length} posts)
            </span>
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{topPost?.content}</p>
        </div>
        <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
      </div>
      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
        <span className="font-medium">
          {(trend.avgEngagement / 1000).toFixed(1)}K avg engagement
        </span>
        <span>•</span>
        <span>{Array.from(trend.platforms).join(', ')}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from(trend.topics).map((topic: string, idx: number) => (
          <span
            key={idx}
            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
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
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const engagement = post.likes + post.shares + post.comments;
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
          {post.content}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium">{post.platform}</span>
          <span>•</span>
          <span>{post.user}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>❤️ {post.likes.toLocaleString()}</span>
          <span>🔄 {post.shares.toLocaleString()}</span>
          <span>💬 {post.comments.toLocaleString()}</span>
        </div>
        <span className="text-xs font-semibold text-purple-600">
          {(engagement / 1000).toFixed(1)}K
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
          {post.topic}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(post.timestamp).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default TrendMinerDashboard;
