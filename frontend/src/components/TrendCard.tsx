import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface TrendCardProps {
  topic: string;
  platform: string;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  sentiment: "positive" | "negative" | "neutral";
  trend: "rising" | "falling" | "stable";
  relevanceScore: number;
  tags: string[];
  platformColor: string;
}

export function TrendCard({
  topic,
  platform,
  likes,
  dislikes,
  shares,
  comments,
  sentiment,
  trend,
  relevanceScore,
  tags,
  platformColor,
}: TrendCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-white to-slate-50 border-2 hover:shadow-2xl transition-all overflow-hidden relative group" style={{
        borderImage: `linear-gradient(135deg, ${platformColor}40, ${platformColor}20) 1`,
        borderImageSlice: 1
      }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl" style={{ 
          backgroundImage: `linear-gradient(135deg, ${platformColor}, transparent)` 
        }} />
        <div className="p-6 relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className="uppercase text-xs shadow-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${platformColor}30, ${platformColor}20)`,
                    color: platformColor,
                    border: `1px solid ${platformColor}40`
                  }}
                >
                  {platform}
                </Badge>
                {trend === "rising" && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                {trend === "falling" && (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <h3 className="text-slate-900 mb-2">{topic}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Relevance:</span>
                <div className="flex-1 max-w-[100px] bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${relevanceScore}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
                <span className="text-sm text-slate-600">{relevanceScore}%</span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="flex flex-col items-center gap-1 bg-green-500/10 rounded-lg p-2">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400">{formatNumber(likes)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-red-500/10 rounded-lg p-2">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-400">{formatNumber(dislikes)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-blue-500/10 rounded-lg p-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-400">{formatNumber(shares)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-purple-500/10 rounded-lg p-2">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-purple-400">{formatNumber(comments)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs border-slate-300 text-slate-700"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Sentiment */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Sentiment:</span>
            <span className={`capitalize ${getSentimentColor()}`}>{sentiment}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
