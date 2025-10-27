import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { InteractiveNode, NodeData } from "./InteractiveNode";

interface Connection {
  from: string;
  to: string;
}

export function NetworkGraph() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate sample nodes with vibrant colors
  const nodes: NodeData[] = [
    {
      id: "1",
      platform: "twitter",
      topic: "AI Revolution",
      likes: 45200,
      dislikes: 1200,
      shares: 8900,
      comments: 3400,
      x: 200,
      y: 150,
      color: "#3B82F6",
    },
    {
      id: "2",
      platform: "youtube",
      topic: "Tech Reviews",
      likes: 125000,
      dislikes: 3200,
      shares: 15600,
      comments: 8700,
      x: 500,
      y: 200,
      color: "#EF4444",
    },
    {
      id: "3",
      platform: "reddit",
      topic: "Web Development",
      likes: 32100,
      dislikes: 890,
      shares: 4500,
      comments: 12300,
      x: 350,
      y: 400,
      color: "#F59E0B",
    },
    {
      id: "4",
      platform: "google",
      topic: "Climate Change",
      likes: 67800,
      dislikes: 5600,
      shares: 23400,
      comments: 15600,
      x: 700,
      y: 350,
      color: "#10B981",
    },
    {
      id: "5",
      platform: "twitter",
      topic: "Crypto Trends",
      likes: 89000,
      dislikes: 12300,
      shares: 34500,
      comments: 23400,
      x: 850,
      y: 150,
      color: "#8B5CF6",
    },
    {
      id: "6",
      platform: "youtube",
      topic: "Gaming News",
      likes: 234000,
      dislikes: 8900,
      shares: 45600,
      comments: 34500,
      x: 150,
      y: 450,
      color: "#EC4899",
    },
    {
      id: "7",
      platform: "reddit",
      topic: "Space Exploration",
      likes: 156000,
      dislikes: 2300,
      shares: 67800,
      comments: 45600,
      x: 600,
      y: 500,
      color: "#06B6D4",
    },
  ];

  // Define connections between nodes
  const connections: Connection[] = [
    { from: "1", to: "2" },
    { from: "1", to: "3" },
    { from: "2", to: "4" },
    { from: "3", to: "4" },
    { from: "2", to: "5" },
    { from: "4", to: "7" },
    { from: "3", to: "6" },
    { from: "6", to: "7" },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-full">
      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {connections.map((conn, index) => {
          const from = getNodePosition(conn.from);
          const to = getNodePosition(conn.to);
          const isConnectedToHovered =
            hoveredNode === conn.from || hoveredNode === conn.to;

          return (
            <motion.line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#connection-gradient)"
              strokeWidth={isConnectedToHovered ? 3 : 2}
              strokeDasharray={isConnectedToHovered ? "0" : "5,5"}
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: isConnectedToHovered ? 0.8 : 0.3,
              }}
              transition={{
                pathLength: { duration: 1.5, delay: index * 0.1 },
                opacity: { duration: 0.3 },
              }}
            />
          );
        })}

        {/* Animated particles on connections */}
        {connections.map((conn, index) => {
          const from = getNodePosition(conn.from);
          const to = getNodePosition(conn.to);
          const isConnectedToHovered =
            hoveredNode === conn.from || hoveredNode === conn.to;

          if (!isConnectedToHovered) return null;

          return (
            <motion.circle
              key={`particle-${index}`}
              r="4"
              fill="#60A5FA"
              initial={{ cx: from.x, cy: from.y }}
              animate={{
                cx: [from.x, to.x, from.x],
                cy: [from.y, to.y, from.y],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}
      </svg>

      {/* Interactive cursor follower */}
      <motion.div
        className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-40 blur-2xl pointer-events-none"
        style={{ zIndex: 0 }}
        animate={{
          x: mousePosition.x - 24,
          y: mousePosition.y - 24,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
        }}
      />

      {/* Nodes */}
      <div className="relative w-full h-full" style={{ zIndex: 2 }}>
        {nodes.map((node) => (
          <InteractiveNode
            key={node.id}
            data={node}
            isHovered={hoveredNode === node.id}
            onHover={() => setHoveredNode(node.id)}
            onLeave={() => setHoveredNode(null)}
            onClick={() => console.log("Clicked node:", node.topic)}
          />
        ))}
      </div>
    </div>
  );
}
