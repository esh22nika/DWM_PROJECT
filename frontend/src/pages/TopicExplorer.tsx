import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Search, Twitter, Youtube, ExternalLink, ThumbsUp, Share2, MessageCircle, Filter, Calendar } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function TopicExplorer() {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingPosts = [
    {
      id: 1,
      platform: "Twitter",
      author: "@AIResearcher",
      content: "Just released our new paper on multimodal AI systems. The results are incredible! 🚀",
      timestamp: "2 hours ago",
      likes: 4523,
      shares: 892,
      comments: 234,
      image: "tech workspace",
      platformColor: "#1DA1F2",
    },
    {
      id: 2,
      platform: "YouTube",
      author: "Tech Reviews Pro",
      content: "Complete guide to building AI applications in 2025",
      timestamp: "5 hours ago",
      likes: 23456,
      shares: 3421,
      comments: 1234,
      thumbnail: "programming code",
      platformColor: "#FF0000",
    },
    {
      id: 3,
      platform: "Reddit",
      author: "u/webdev_master",
      content: "I built a real-time trend analysis dashboard using React and Python. Here's what I learned...",
      timestamp: "1 day ago",
      likes: 8765,
      shares: 1234,
      comments: 567,
      subreddit: "r/webdev",
      platformColor: "#FF4500",
    },
    {
      id: 4,
      platform: "Twitter",
      author: "@ClimateScience",
      content: "New breakthrough in carbon capture technology could be a game changer 🌍",
      timestamp: "3 hours ago",
      likes: 12345,
      shares: 4567,
      comments: 890,
      image: "nature environment",
      platformColor: "#1DA1F2",
    },
  ];

  const relatedTopics = [
    { name: "Machine Learning", strength: 95, posts: 2345 },
    { name: "Neural Networks", strength: 88, posts: 1876 },
    { name: "Deep Learning", strength: 82, posts: 1654 },
    { name: "Computer Vision", strength: 76, posts: 1432 },
    { name: "NLP", strength: 71, posts: 1298 },
    { name: "Data Science", strength: 68, posts: 1156 },
  ];

  const topContributors = [
    { name: "@AIResearcher", platform: "Twitter", posts: 234, engagement: 125000 },
    { name: "Tech Reviews Pro", platform: "YouTube", posts: 89, engagement: 456000 },
    { name: "u/ml_enthusiast", platform: "Reddit", posts: 456, engagement: 89000 },
    { name: "@DataScience", platform: "Twitter", posts: 312, engagement: 201000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Colorful accents */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-cyan-400 to-blue-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-indigo-400 to-purple-400 opacity-15 rounded-full blur-3xl animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-slate-900">Topic Explorer</h1>
          <p className="text-xl text-slate-600">
            Drill down into specific trends and discover detailed insights
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white border-slate-200 p-6 shadow-md">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search topics, hashtags, or keywords..."
                  className="pl-10 bg-white border-slate-300 text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 shadow-md">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Feed */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-white border border-slate-200 mb-4">
                <TabsTrigger value="all">All Posts</TabsTrigger>
                <TabsTrigger value="twitter">Twitter</TabsTrigger>
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="reddit">Reddit</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {trendingPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors overflow-hidden shadow-md hover:shadow-lg">
                      <div className="p-6">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: post.platformColor + "20" }}
                            >
                              {post.platform === "Twitter" && (
                                <Twitter className="w-5 h-5" style={{ color: post.platformColor }} />
                              )}
                              {post.platform === "YouTube" && (
                                <Youtube className="w-5 h-5" style={{ color: post.platformColor }} />
                              )}
                              {post.platform === "Reddit" && (
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill={post.platformColor}>
                                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className="text-slate-900">{post.author}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-0 px-0"
                                  style={{ color: post.platformColor }}
                                >
                                  {post.platform}
                                </Badge>
                                {post.subreddit && <span>• {post.subreddit}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {post.timestamp}
                          </div>
                        </div>

                        {/* Post Content */}
                        <p className="text-slate-700 mb-4">{post.content}</p>

                        {/* Engagement Metrics */}
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{post.likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            <span>{post.shares.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments.toLocaleString()}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto text-slate-600 hover:text-slate-900"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Original
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="twitter" className="space-y-4">
                {trendingPosts
                  .filter((p) => p.platform === "Twitter")
                  .map((post, index) => (
                    <Card key={post.id} className="bg-white border-slate-200 p-6 shadow-md">
                      <p className="text-slate-700">{post.content}</p>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Topics */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Related Topics</h3>
              <div className="space-y-3">
                {relatedTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700">{topic.name}</span>
                      <span className="text-xs text-slate-500">{topic.posts} posts</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.strength}%` }}
                        transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Top Contributors */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Top Contributors</h3>
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-slate-900">{contributor.name}</div>
                      <div className="text-xs text-slate-500">{contributor.platform}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-cyan-600">{contributor.posts} posts</div>
                      <div className="text-xs text-slate-500">
                        {(contributor.engagement / 1000).toFixed(0)}K eng.
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Trending Hashtags */}
            <Card className="bg-white border-slate-200 p-6 shadow-md">
              <h3 className="text-slate-900 mb-4">Trending Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: "#AI", color: "from-blue-400 to-cyan-400" },
                  { tag: "#MachineLearning", color: "from-purple-400 to-pink-400" },
                  { tag: "#TechNews", color: "from-orange-400 to-red-400" },
                  { tag: "#Innovation", color: "from-green-400 to-emerald-400" },
                  { tag: "#DataScience", color: "from-indigo-400 to-blue-400" },
                  { tag: "#Python", color: "from-yellow-400 to-orange-400" }
                ].map((item, index) => (
                    <Badge
                      key={index}
                      className={`bg-gradient-to-r ${item.color} text-white border-0 cursor-pointer hover:shadow-lg transition-all shadow-md`}
                    >
                      {item.tag}
                    </Badge>
                  )
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
