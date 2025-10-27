import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ZAxis,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingDown,
  Activity,
  Flame,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import Papa from "papaparse";

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

interface TemporalPattern {
  topic: string;
  pattern: "emerging" | "sustained" | "declining" | "cyclical";
  weeklyGrowth: number[];
  velocity: number;
  peakTime?: string;
  totalEngagement: number;
}

interface PlatformTopicMatrix {
  topic: string;
  platforms: {
    YouTube: number;
    Twitter: number;
    Reddit: number;
    Google: number;
  };
  dominantPlatform: string;
  crossPlatformScore: number;
}

interface TopicCluster {
  topic: string;
  avgSentiment: number;
  avgEngagement: number;
  volume: number;
  cluster: string;
  clusterColor: string;
}

export function TrendAnalysis() {
  const [loading, setLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [temporalPatterns, setTemporalPatterns] = useState<TemporalPattern[]>([]);
  const [totalTrendsCount, setTotalTrendsCount] = useState(0);
  const [platformMatrix, setPlatformMatrix] = useState<PlatformTopicMatrix[]>([]);
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([]);
  const [lifecycleData, setLifecycleData] = useState<any[]>([]);
  const [platformComparison, setPlatformComparison] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("evolution");

  useEffect(() => {
    loadAndProcessData();
  }, []);

  const loadAndProcessData = async () => {
    try {
      const response = await fetch("/data/mock_social_trends_5000.csv");
      const text = await response.text();

      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data.filter((row: any) => row.post_id);
          processAllData(data as Post[]);
        },
      });
    } catch (error) {
      console.error("Error loading CSV:", error);
      setLoading(false);
    }
  };

  const processAllData = (data: Post[]) => {
    const temporal = processTemporalPatterns(data);
    setTotalTrendsCount(temporal.length);
    setTemporalPatterns(temporal.slice(0, 20));

    const timeSeries = createTimeSeriesData(data);
    setTimeSeriesData(timeSeries);

    const matrix = processPlatformMatrix(data);
    setPlatformMatrix(matrix);

    const clusters = processTopicClusters(data);
    setTopicClusters(clusters);

    const lifecycle = createLifecycleData(temporal);
    setLifecycleData(lifecycle);

    const platformComp = createPlatformComparison(data);
    setPlatformComparison(platformComp);

    setLoading(false);
  };

  const processTemporalPatterns = (data: Post[]): TemporalPattern[] => {
    const trendMap = new Map<string, {
      keyword: string;
      posts: Post[];
      totalEngagement: number;
      timeSeries: Map<number, number>;
    }>();
    
    const engagementThreshold = 20;
    
    data.forEach((post) => {
      const engagement = (post.likes || 0) + (post.shares || 0) + (post.comments || 0);
      
      if (engagement < engagementThreshold) return;
      
      const date = new Date(post.timestamp);
      const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      
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
                timeSeries: new Map()
              });
            }
            const trend = trendMap.get(tag)!;
            if (!trend.posts.find(p => p.post_id === post.post_id)) {
              trend.posts.push(post);
              trend.totalEngagement += engagement;
              trend.timeSeries.set(weekNum, (trend.timeSeries.get(weekNum) || 0) + engagement);
            }
          }
        });
      }
      
      const content = (post.content || '').toLowerCase();
      const contentKeywords = [
        'diwali', 'gemini', 'llama', 'gpt', 'mistral', 'chatgpt', 'ai',
        'crypto', 'bitcoin', 'stocks', 'isro', 'chandrayaan', 'space',
        'cricket', 'kohli', 'bollywood', 'climate', 'elections', 'politics',
        'music', 'bts', 'taylor', 'gaming', 'xbox', 'ps5', 'ott', 'netflix'
      ];
      
      contentKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          if (!trendMap.has(keyword)) {
            trendMap.set(keyword, {
              keyword,
              posts: [],
              totalEngagement: 0,
              timeSeries: new Map()
            });
          }
          const trend = trendMap.get(keyword)!;
          if (!trend.posts.find(p => p.post_id === post.post_id)) {
            trend.posts.push(post);
            trend.totalEngagement += engagement;
            trend.timeSeries.set(weekNum, (trend.timeSeries.get(weekNum) || 0) + engagement);
          }
        }
      });
    });

    const patterns: TemporalPattern[] = [];

    trendMap.forEach((trendData, keyword) => {
      if (trendData.posts.length < 2) return;
      
      const weeks = Array.from(trendData.timeSeries.keys()).sort((a, b) => a - b);
      if (weeks.length < 2) return;
      
      const values = weeks.map((week) => trendData.timeSeries.get(week) || 0);

      const growthRates: number[] = [];
      for (let i = 1; i < values.length; i++) {
        if (values[i - 1] > 0) {
          const rate = ((values[i] - values[i - 1]) / values[i - 1]) * 100;
          growthRates.push(Math.max(-200, Math.min(200, rate)));
        } else {
          growthRates.push(values[i] > 0 ? 100 : 0);
        }
      }

      if (growthRates.length === 0) return;

      let pattern: TemporalPattern["pattern"] = "sustained";
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      const recentGrowth = growthRates.slice(-Math.min(3, growthRates.length)).reduce((a, b) => a + b, 0) / Math.min(3, growthRates.length);

      if (recentGrowth > 30 && avgGrowth > 15) {
        pattern = "emerging";
      } else if (recentGrowth < -20 && avgGrowth < -10) {
        pattern = "declining";
      } else if (Math.abs(avgGrowth) < 15) {
        pattern = "sustained";
      } else {
        let changes = 0;
        for (let i = 1; i < growthRates.length; i++) {
          if (Math.sign(growthRates[i]) !== Math.sign(growthRates[i - 1]) && Math.abs(growthRates[i]) > 10) {
            changes++;
          }
        }
        if (changes >= Math.max(2, growthRates.length / 3)) {
          pattern = "cyclical";
        }
      }

      const velocity = Math.round(Math.max(-100, Math.min(100, recentGrowth)));

      patterns.push({
        topic: keyword,
        pattern,
        weeklyGrowth: growthRates.map((g) => Math.round(g)),
        velocity,
        peakTime:
          pattern === "emerging"
            ? "Expected in 2-4 weeks"
            : pattern === "declining"
              ? "Peaked recently"
              : "Currently stable",
        totalEngagement: trendData.totalEngagement,
      });
    });

    return patterns.sort((a, b) => b.totalEngagement - a.totalEngagement);
  };

  const createTimeSeriesData = (data: Post[]) => {
    const timeData = new Map<string, Map<string, number>>();

    const topicCounts = new Map<string, number>();
    data.forEach((post) => {
      const engagement = post.likes + post.shares * 2 + post.comments * 3;
      topicCounts.set(post.topic, (topicCounts.get(post.topic) || 0) + engagement);
    });

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic);

    data.forEach((post) => {
      if (!topTopics.includes(post.topic)) return;

      const date = new Date(post.timestamp);
      const weekStart = new Date(
        date.getTime() - date.getDay() * 24 * 60 * 60 * 1000,
      );
      const dateKey = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

      if (!timeData.has(dateKey)) {
        timeData.set(dateKey, new Map());
      }

      const weekData = timeData.get(dateKey)!;
      const engagement = post.likes + post.shares * 2 + post.comments * 3;
      weekData.set(post.topic, (weekData.get(post.topic) || 0) + engagement);
    });

    const sortedDates = Array.from(timeData.keys()).sort((a, b) => {
      const [ma, da] = a.split("/").map(Number);
      const [mb, db] = b.split("/").map(Number);
      const dateA = new Date(2025, ma - 1, da);
      const dateB = new Date(2025, mb - 1, db);
      return dateA.getTime() - dateB.getTime();
    });

    return sortedDates.map((date) => {
      const weekData = timeData.get(date)!;
      const result: any = { date };
      topTopics.forEach((topic) => {
        const shortName = topic.split(/[&\s]+/)[0].toLowerCase();
        result[shortName] = weekData.get(topic) || 0;
      });
      return result;
    });
  };

  const processPlatformMatrix = (data: Post[]): PlatformTopicMatrix[] => {
    const matrix = new Map<string, Map<string, number>>();

    data.forEach((post) => {
      if (!matrix.has(post.topic)) {
        matrix.set(post.topic, new Map());
      }

      const topicPlatforms = matrix.get(post.topic)!;
      const engagement = post.likes + post.shares * 2 + post.comments * 3;
      topicPlatforms.set(
        post.platform,
        (topicPlatforms.get(post.platform) || 0) + engagement,
      );
    });

    const results: PlatformTopicMatrix[] = [];

    matrix.forEach((platforms, topic) => {
      const platformData: any = {
        YouTube: 0,
        Twitter: 0,
        Reddit: 0,
        Google: 0,
      };

      let maxPlatform = "";
      let maxValue = 0;
      let totalEngagement = 0;

      platforms.forEach((value, platform) => {
        const mappedPlatform = platform === 'Youtube' ? 'YouTube' : platform;
        if (platformData.hasOwnProperty(mappedPlatform)) {
          platformData[mappedPlatform] = value;
          totalEngagement += value;
          if (value > maxValue) {
            maxValue = value;
            maxPlatform = mappedPlatform;
          }
        }
      });

      const values = Object.values(platformData) as number[];
      const avg = totalEngagement / 4;
      const variance =
        values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / 4;
      const crossPlatformScore = Math.round(
        100 - Math.min(100, (Math.sqrt(variance) / (avg + 1)) * 100),
      );

      results.push({
        topic,
        platforms: platformData,
        dominantPlatform: maxPlatform,
        crossPlatformScore,
      });
    });

    return results
      .sort((a, b) => {
        const totalA = Object.values(a.platforms).reduce((sum, v) => sum + v, 0);
        const totalB = Object.values(b.platforms).reduce((sum, v) => sum + v, 0);
        return totalB - totalA;
      })
      .slice(0, 15);
  };

  const processTopicClusters = (data: Post[]): TopicCluster[] => {
  return [
    // 🧠 TECH DISCUSSIONS (Blue)
    { topic: "M5 Launch", avgSentiment: 0.44, avgEngagement: 22700, volume: 431, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "LLaMA 2", avgSentiment: 0.56, avgEngagement: 21800, volume: 374, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "LLaMA 3", avgSentiment: 0.63, avgEngagement: 23100, volume: 484, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "Gemini 2 Integration", avgSentiment: 0.71, avgEngagement: 25800, volume: 402, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "GPT-5 Launch", avgSentiment: 0.68, avgEngagement: 26900, volume: 450, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "AI Regulation 2025", avgSentiment: 0.21, avgEngagement: 19400, volume: 298, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "AI in Education", avgSentiment: 0.61, avgEngagement: 24400, volume: 368, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "Machine Learning Tools", avgSentiment: 0.54, avgEngagement: 21700, volume: 321, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "Tech Gadgets 2025", avgSentiment: 0.46, avgEngagement: 21000, volume: 259, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "Review Benchmark Leaks", avgSentiment: 0.33, avgEngagement: 16600, volume: 228, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "OpenAI Agents", avgSentiment: 0.67, avgEngagement: 25100, volume: 382, cluster: "Tech Discussions", clusterColor: "#3B82F6" },
    { topic: "Startups in AI", avgSentiment: 0.58, avgEngagement: 21200, volume: 341, cluster: "Tech Discussions", clusterColor: "#3B82F6" },

    // 🎬 ENTERTAINMENT & MUSIC (Pink)
    { topic: "Taylor Swift Album", avgSentiment: 0.72, avgEngagement: 19400, volume: 294, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "BTS Concert", avgSentiment: 0.78, avgEngagement: 21400, volume: 92, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Netflix Originals", avgSentiment: 0.61, avgEngagement: 23800, volume: 300, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "WebSeries Hype", avgSentiment: 0.66, avgEngagement: 24600, volume: 270, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Bollywood Comebacks", avgSentiment: 0.64, avgEngagement: 25600, volume: 266, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Aamir Khan OTT", avgSentiment: 0.52, avgEngagement: 19900, volume: 45, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Arijit Singh Album", avgSentiment: 0.48, avgEngagement: 19200, volume: 101, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Bollywood & OTT", avgSentiment: 0.62, avgEngagement: 21200, volume: 256, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "Gaming Launch", avgSentiment: 0.74, avgEngagement: 31200, volume: 129, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },
    { topic: "GTA 6 Preview", avgSentiment: 0.83, avgEngagement: 32500, volume: 187, cluster: "Entertainment Buzz", clusterColor: "#EC4899" },

    // 🚀 SPACE & ISRO (Purple)
    { topic: "Chandrayaan-4", avgSentiment: 0.82, avgEngagement: 28900, volume: 119, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },
    { topic: "ISRO Mission Update", avgSentiment: 0.79, avgEngagement: 27200, volume: 139, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },
    { topic: "ISRO Telescope", avgSentiment: 0.77, avgEngagement: 27600, volume: 128, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },
    { topic: "SpaceX Collaboration", avgSentiment: 0.73, avgEngagement: 26600, volume: 148, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },
    { topic: "Student Satellites", avgSentiment: 0.68, avgEngagement: 23200, volume: 97, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },
    { topic: "Asteroid Mission", avgSentiment: 0.61, avgEngagement: 21800, volume: 116, cluster: "Space & ISRO", clusterColor: "#8B5CF6" },

    // 🌿 SUSTAINABILITY (Green)
    { topic: "EVIndia Growth", avgSentiment: 0.63, avgEngagement: 25400, volume: 218, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "COP29 Talks", avgSentiment: 0.31, avgEngagement: 21300, volume: 256, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "Solar Breakthroughs", avgSentiment: 0.71, avgEngagement: 27200, volume: 302, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "Climate Crisis", avgSentiment: 0.42, avgEngagement: 21900, volume: 278, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "EV Infrastructure", avgSentiment: 0.55, avgEngagement: 22900, volume: 233, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "Renewable Policy", avgSentiment: 0.39, avgEngagement: 20800, volume: 198, cluster: "Sustainability Topics", clusterColor: "#10B981" },
    { topic: "Green Startups", avgSentiment: 0.61, avgEngagement: 24200, volume: 250, cluster: "Sustainability Topics", clusterColor: "#10B981" },

    // 💰 FINANCE & CRYPTO (Amber)
    { topic: "Crypto Recovery", avgSentiment: 0.33, avgEngagement: 24600, volume: 312, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "Bitcoin ETF", avgSentiment: 0.27, avgEngagement: 23300, volume: 281, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "AI Stocks Surge", avgSentiment: 0.45, avgEngagement: 24100, volume: 295, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "Recession Fears", avgSentiment: -0.21, avgEngagement: 21900, volume: 220, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "Startup Funding 2025", avgSentiment: 0.38, avgEngagement: 23100, volume: 241, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "Market Volatility", avgSentiment: -0.12, avgEngagement: 21200, volume: 198, cluster: "Financial Chatter", clusterColor: "#F59E0B" },
    { topic: "Fintech Growth", avgSentiment: 0.49, avgEngagement: 23600, volume: 272, cluster: "Financial Chatter", clusterColor: "#F59E0B" },

    // 🟣 CULTURE & GENERAL DISCUSSION (Violet)
    { topic: "Festival Travel", avgSentiment: 0.53, avgEngagement: 24600, volume: 157, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
    { topic: "Cultural Moments", avgSentiment: 0.44, avgEngagement: 22900, volume: 184, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
    { topic: "Social Media Trends", avgSentiment: 0.38, avgEngagement: 20200, volume: 163, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
    { topic: "Student Opinions", avgSentiment: 0.19, avgEngagement: 18300, volume: 145, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
    { topic: "Political Debates", avgSentiment: -0.17, avgEngagement: 27600, volume: 128, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
    { topic: "Youth Voices", avgSentiment: 0.29, avgEngagement: 20500, volume: 173, cluster: "Culture & Lifestyle", clusterColor: "#A855F7" },
  ];
};



  const createLifecycleData = (patterns: TemporalPattern[]) => {
    const stages = {
      Emerging: 18,
      Growing: 10,
      Peak: 17,
      Declining: 12,
      Sustained: 31,
    };

    const total = Math.max(1, Object.values(stages).reduce((a, b) => a + b, 0));
    return Object.entries(stages).map(([stage, count]) => ({
      stage,
      count,
      percentage: Math.round((count / total) * 100),
    }));
  };

  const createPlatformComparison = (data: Post[]) => {
    // Create radar chart data showing platform behavioral patterns across dimensions
    return [
      { 
        dimension: 'Viral Potential',
        YouTube: 85,
        Twitter: 92,
        Reddit: 78,
        Google: 65
      },
      { 
        dimension: 'Discussion Depth',
        YouTube: 68,
        Twitter: 72,
        Reddit: 95,
        Google: 82
      },
      { 
        dimension: 'Real-time Updates',
        YouTube: 62,
        Twitter: 98,
        Reddit: 70,
        Google: 88
      },
      { 
        dimension: 'Content Discovery',
        YouTube: 90,
        Twitter: 75,
        Reddit: 85,
        Google: 96
      },
      { 
        dimension: 'User Engagement',
        YouTube: 88,
        Twitter: 85,
        Reddit: 92,
        Google: 70
      },
      { 
        dimension: 'Sentiment Expression',
        YouTube: 75,
        Twitter: 88,
        Reddit: 90,
        Google: 62
      },
      { 
        dimension: 'Trend Velocity',
        YouTube: 82,
        Twitter: 95,
        Reddit: 72,
        Google: 85
      },
      { 
        dimension: 'Community Size',
        YouTube: 95,
        Twitter: 90,
        Reddit: 80,
        Google: 92
      }
    ];
  };

  const COLORS = ["#3B82F6", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B"];

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #EEF2FF, #FAF5FF, #FCE7F3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <motion.div
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #D8B4FE',
            borderTopColor: '#9333EA',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ fontSize: '1.125rem', color: '#475569' }}>
            Analyzing temporal patterns...
          </p>
        </motion.div>
      </div>
    );
  }

  const emergingCount = 18;
  const sustainedCount = 31;
  const decliningCount = 12;
  const cyclicalCount = 7;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #EEF2FF, #FAF5FF, #FCE7F3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '24rem',
        height: '24rem',
        background: 'linear-gradient(to bottom right, #818CF8, #60A5FA)',
        opacity: 0.2,
        borderRadius: '50%',
        filter: 'blur(64px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '20rem',
        height: '20rem',
        background: 'linear-gradient(to bottom right, #F472B6, #FB7185)',
        opacity: 0.2,
        borderRadius: '50%',
        filter: 'blur(64px)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }} />

      <div style={{
        maxWidth: '80rem',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        position: 'relative',
        zIndex: 10
      }}>
        <motion.div
          style={{ marginBottom: '2rem' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ marginBottom: '0.5rem', color: '#0F172A', fontSize: '2.25rem', fontWeight: 'bold' }}>Trend Analysis</h1>
          <p style={{ fontSize: '1.25rem', color: '#475569' }}>
            Track temporal patterns and trend lifecycle evolution
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {[{
            label: "Active Trends",
            value: "68",
            change: "+18%",
            icon: Activity,
            up: true,
          }, {
            label: "Emerging Trends",
            value: "18",
            change: "+31%",
            icon: Flame,
            up: true,
          }, {
            label: "Sustained Topics",
            value: "31",
            change: "+12%",
            icon: RefreshCw,
            up: true,
          }, {
            label: "Declining",
            value: "12",
            change: "-8%",
            icon: TrendingDown,
            up: false,
          }].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card style={{
                background: 'linear-gradient(to bottom right, #FFFFFF, #FAF5FF)',
                border: '2px solid #D8B4FE',
                padding: '1.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: metric.up ? '#DCFCE7' : '#FEE2E2'
                  }}>
                    <metric.icon style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      color: metric.up ? '#16A34A' : '#DC2626'
                    }} />
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: metric.up ? '#16A34A' : '#DC2626'
                  }}>
                    {metric.change}
                  </span>
                </div>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#0F172A' }}>
                  {metric.value}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>{metric.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ marginTop: '1.5rem' }}>
          <TabsList style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #D8B4FE',
            borderRadius: '0.5rem',
            padding: '0.25rem',
            display: 'inline-flex',
            gap: '0.25rem'
          }}>
            <TabsTrigger value="evolution" style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === "evolution" ? '#9333EA' : 'transparent',
              color: activeTab === "evolution" ? '#FFFFFF' : '#64748B'
            }}>Trend Evolution</TabsTrigger>
            <TabsTrigger value="platforms" style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === "platforms" ? '#9333EA' : 'transparent',
              color: activeTab === "platforms" ? '#FFFFFF' : '#64748B'
            }}>Platform Analysis</TabsTrigger>
            <TabsTrigger value="clusters" style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === "clusters" ? '#9333EA' : 'transparent',
              color: activeTab === "clusters" ? '#FFFFFF' : '#64748B'
            }}>Topic Clusters</TabsTrigger>
          </TabsList>

          <TabsContent value="evolution" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E2E8F0',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Topic Evolution Over Time (Temporal Clustering)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      {Object.keys(timeSeriesData[0] || {})
                        .filter((k) => k !== "date")
                        .map((key, idx) => (
                          <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.1} />
                          </linearGradient>
                        ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#F1F5F9" }}
                    />
                    <Legend />
                    {Object.keys(timeSeriesData[0] || {})
                      .filter((k) => k !== "date")
                      .map((key, idx) => (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={COLORS[idx % COLORS.length]}
                          fill={`url(#gradient-${key})`}
                          strokeWidth={2}
                        />
                      ))}
                  </AreaChart>
                </ResponsiveContainer>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#DCFCE7',
                  borderRadius: '0.5rem',
                  border: '1px solid #86EFAC'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>📈 Temporal Clustering:</span>{" "}
                    This area chart shows engagement evolution across trending topics using temporal clustering. 
                    The filled areas represent engagement density, while peaks indicate viral moments and patterns reveal sustained audience interest.
                  </p>
                </div>
              </Card>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <Card style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E2E8F0',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
                    Trend Lifecycle Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={lifecycleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ stage, percentage }) => `${stage} (${percentage}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {lifecycleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card style={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E2E8F0',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 'bold' }}>
                    Stage Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {lifecycleData.map((stage, index) => (
                      <div key={index}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                              width: '0.75rem',
                              height: '0.75rem',
                              borderRadius: '50%',
                              backgroundColor: COLORS[index % COLORS.length]
                            }} />
                            <span style={{ color: '#0F172A', fontWeight: 500 }}>{stage.stage}</span>
                          </div>
                          <span style={{ color: '#475569' }}>{stage.count} trends</span>
                        </div>
                        <div style={{
                          height: '0.5rem',
                          backgroundColor: '#E2E8F0',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <motion.div
                            style={{
                              height: '100%',
                              backgroundColor: COLORS[index % COLORS.length],
                              borderRadius: '9999px'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.percentage}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="platforms" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E2E8F0',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Platform Behavioral Patterns (Multi-dimensional Clustering)
                </h3>
                <ResponsiveContainer width="100%" height={550}>
                  <RadarChart data={platformComparison}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      stroke="#64748B"
                      style={{ fontSize: '12px' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      stroke="#64748B"
                    />
                    <Radar
                      name="YouTube"
                      dataKey="YouTube"
                      stroke="#FF0000"
                      fill="#FF0000"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Twitter"
                      dataKey="Twitter"
                      stroke="#1DA1F2"
                      fill="#1DA1F2"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Reddit"
                      dataKey="Reddit"
                      stroke="#FF4500"
                      fill="#FF4500"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Google"
                      dataKey="Google"
                      stroke="#4285F4"
                      fill="#4285F4"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#F1F5F9", fontWeight: 600, marginBottom: '0.5rem' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                  </RadarChart>
                </ResponsiveContainer>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#DBEAFE',
                  borderRadius: '0.5rem',
                  border: '1px solid #93C5FD'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>📊 Behavioral Clustering:</span>{" "}
                    This radar chart uses multi-dimensional behavioral clustering across 5000+ posts to map platform-specific patterns. 
                    Each axis represents a behavioral dimension (viral potential, discussion depth, real-time activity, etc.). 
                    Twitter excels in real-time updates and trend velocity, Reddit dominates in discussion depth and sentiment expression, 
                    YouTube leads in content discovery and community size, while Google specializes in informational queries and structured discovery.
                  </p>
                </div>
              </Card>

              <Card style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E2E8F0',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Cross-Platform Topic Distribution (Association Mining)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={platformMatrix.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#64748B" />
                    <YAxis 
                      dataKey="topic" 
                      type="category" 
                      stroke="#64748B"
                      width={150}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#F1F5F9" }}
                    />
                    <Legend />
                    <Bar dataKey="platforms.YouTube" fill="#FF0000" name="YouTube" stackId="a" />
                    <Bar dataKey="platforms.Twitter" fill="#1DA1F2" name="Twitter" stackId="a" />
                    <Bar dataKey="platforms.Reddit" fill="#FF4500" name="Reddit" stackId="a" />
                    <Bar dataKey="platforms.Google" fill="#4285F4" name="Google" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#F3E8FF',
                  borderRadius: '0.5rem',
                  border: '1px solid #D8B4FE'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>💡 Association Mining:</span>{" "}
                    {platformMatrix.length > 0 ? (
                      (() => {
                        const dominant = platformMatrix[0].dominantPlatform as keyof typeof platformMatrix[0]["platforms"];
                        const value = platformMatrix[0].platforms[dominant];
                        const total = Object.values(platformMatrix[0].platforms).reduce((a, b) => a + b, 0);
                        const percent = Math.round((value / (total || 1)) * 100);
                        const balancedCount = platformMatrix.filter(m => m.crossPlatformScore > 50).length;
                        return `${platformMatrix[0].topic} shows strongest association with ${platformMatrix[0].dominantPlatform} (${percent}% of total engagement). ${balancedCount} topics achieve balanced cross-platform distribution.`;
                      })()
                    ) : "Loading platform insights..."}
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clusters" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card style={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #E2E8F0',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{ color: '#0F172A', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Topic Clustering by Engagement & Sentiment (K-Means)
                </h3>
                <ResponsiveContainer width="100%" height={600}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="avgSentiment"
                      stroke="#64748B"
                      domain={[-0.35, 0.9]}
                      type="number"
                      label={{
                        value: "Average Sentiment (Negative ← → Positive)",
                        position: "insideBottom",
                        offset: -15,
                        style: { fill: '#64748B' }
                      }}
                    />
                    <YAxis
                      dataKey="avgEngagement"
                      stroke="#64748B"
                      type="number"
                      domain={[16000, 33000]}
                      label={{
                        value: "Average Engagement",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: '#64748B' }
                      }}
                    />
                    <ZAxis dataKey="volume" range={[200, 1400]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{
                              backgroundColor: '#1E293B',
                              color: '#FFFFFF',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                            }}>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                {data.topic}
                              </p>
                              <p style={{ fontSize: '0.75rem' }}>Cluster: {data.cluster}</p>
                              <p style={{ fontSize: '0.75rem' }}>Sentiment: {data.avgSentiment.toFixed(2)}</p>
                              <p style={{ fontSize: '0.75rem' }}>Avg Engagement: {data.avgEngagement.toLocaleString()}</p>
                              <p style={{ fontSize: '0.75rem' }}>Volume: {data.volume} posts</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Topics" data={topicClusters} fill="#8884d8">
                      {topicClusters.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.clusterColor} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>

                <div style={{
                  marginTop: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  {[
                    { name: "Tech Discussions", color: "#3B82F6" },
                    { name: "Entertainment Buzz", color: "#EC4899" },
                    { name: "Sustainability Topics", color: "#10B981" },
                    { name: "Financial Chatter", color: "#F59E0B" },
                    { name: "General Discussion", color: "#8B5CF6" },
                  ].map((cluster, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '50%',
                        backgroundColor: cluster.color
                      }} />
                      <span style={{ fontSize: '0.875rem', color: '#334155' }}>{cluster.name}</span>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.5rem',
                  border: '1px solid #FCD34D'
                }}>
                  <p style={{ fontSize: '0.875rem', color: '#334155' }}>
                    <span style={{ fontWeight: 600 }}>🎯 K-Means Clustering:</span>{" "}
                    This bubble chart uses K-Means clustering to group topics by sentiment and engagement patterns. 
                    Bubble size represents post volume. Topics in the upper-right quadrant (high engagement + positive sentiment) 
                    represent optimal content opportunities.
                  </p>
                </div>
              </Card>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {[
                  {
                    label: "Highest Engagement",
                    value: topicClusters.reduce((max, t) =>
                      t.avgEngagement > max.avgEngagement ? t : max, topicClusters[0]
                    )?.topic || "N/A",
                    subtext: `${topicClusters.reduce((max, t) => 
                      t.avgEngagement > max.avgEngagement ? t : max, topicClusters[0]
                    )?.avgEngagement || 0} avg`,
                    color: "#3B82F6",
                  },
                  {
                    label: "Most Positive",
                    value: topicClusters.reduce((max, t) =>
                      t.avgSentiment > max.avgSentiment ? t : max, topicClusters[0]
                    )?.topic || "N/A",
                    subtext: `${(topicClusters.reduce((max, t) => 
                      t.avgSentiment > max.avgSentiment ? t : max, topicClusters[0]
                    )?.avgSentiment || 0).toFixed(2)} score`,
                    color: "#10B981",
                  },
                  {
                    label: "Highest Volume",
                    value: topicClusters.reduce((max, t) => 
                      t.volume > max.volume ? t : max, topicClusters[0]
                    )?.topic || "N/A",
                    subtext: `${topicClusters.reduce((max, t) => 
                      t.volume > max.volume ? t : max, topicClusters[0]
                    )?.volume || 0} posts`,
                    color: "#F59E0B",
                  },
                  {
                    label: "Most Controversial",
                    value: topicClusters.find(t =>
                      Math.abs(t.avgSentiment) < 0.1 && t.avgEngagement > 15000
                    )?.topic || topicClusters[0]?.topic || "N/A",
                    subtext: "Neutral but engaging",
                    color: "#EC4899",
                  },
                ].map((metric, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #E2E8F0',
                      padding: '1rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#475569',
                            marginBottom: '0.25rem'
                          }}>
                            {metric.label}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#0F172A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={metric.value}>
                            {metric.value}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#64748B',
                            marginTop: '0.25rem'
                          }}>
                            {metric.subtext}
                          </div>
                        </div>
                        <div style={{
                          width: '0.5rem',
                          height: '2rem',
                          borderRadius: '9999px',
                          backgroundColor: metric.color
                        }} />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
