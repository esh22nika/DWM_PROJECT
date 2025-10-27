import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle, Twitter, Youtube } from "lucide-react";
import { useState } from "react";

export interface NodeData {
  id: string;
  platform: "twitter" | "youtube" | "reddit" | "google";
  topic: string;
  likes: number;
  dislikes: number;
  shares: number;
  comments: number;
  x: number;
  y: number;
  color: string;
}

interface InteractiveNodeProps {
  data: NodeData;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export function InteractiveNode({ data, isHovered, onHover, onLeave, onClick }: InteractiveNodeProps) {
  const [isClicked, setIsClicked] = useState(false);

  const getPlatformIcon = () => {
    switch (data.platform) {
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      case "youtube":
        return <Youtube className="w-5 h-5" />;
      case "reddit":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        );
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        );
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleClick = () => {
    setIsClicked(true);
    onClick();
    setTimeout(() => setIsClicked(false), 300);
  };

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: data.x,
        top: data.y,
        x: "-50%",
        y: "-50%",
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isClicked ? 1.2 : isHovered ? 1.15 : 1,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      onClick={handleClick}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{ 
          background: `radial-gradient(circle, ${data.color}80, ${data.color}40, transparent)`
        }}
        animate={{
          opacity: isHovered ? 0.8 : 0.5,
          scale: isHovered ? 1.6 : 1.3,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Main node container */}
      <div className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl border-2 p-4 min-w-[200px] hover:shadow-3xl transition-shadow" style={{ borderColor: data.color }}>
        {/* Platform header */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: data.color + "40" }}>
          <div className="p-2 rounded-lg" style={{ backgroundColor: data.color + "20", color: data.color }}>
            {getPlatformIcon()}
          </div>
          <div className="flex-1">
            <div className="uppercase tracking-wider opacity-60 text-slate-600" style={{ fontSize: "10px" }}>
              {data.platform}
            </div>
            <div className="truncate max-w-[120px] text-slate-900">{data.topic}</div>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 rounded-lg p-2">
            <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
            <span className="text-green-700">{formatNumber(data.likes)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 rounded-lg p-2">
            <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
            <span className="text-red-700">{formatNumber(data.dislikes)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 rounded-lg p-2">
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-700">{formatNumber(data.shares)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-50 rounded-lg p-2">
            <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-purple-700">{formatNumber(data.comments)}</span>
          </div>
        </div>

        {/* Pulse indicator */}
        {isHovered && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
