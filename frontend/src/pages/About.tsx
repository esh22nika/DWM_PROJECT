import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { Database, Brain, TrendingUp, Users, Cpu, BarChart3 } from "lucide-react";

export function About() {
  const features = [
    {
      icon: Database,
      title: "Multi-Dimensional Data Warehouse",
      description:
        "Star/snowflake schema design efficiently stores and queries social media trend data across time, platform, location, and content dimensions.",
    },
    {
      icon: Brain,
      title: "Advanced Pattern Mining",
      description:
        "Apriori, FP-Growth, and Sequential Pattern Mining algorithms discover frequent itemsets, association rules, and temporal patterns.",
    },
    {
      icon: TrendingUp,
      title: "Trend Lifecycle Analysis",
      description:
        "Track trends through their lifecycle stages: emerging, growing, peak, declining, and dormant with predictive capabilities.",
    },
    {
      icon: Users,
      title: "Personalized Recommendations",
      description:
        "Build user interest profiles to rank and filter trends according to individual relevance with cross-interest pattern discovery.",
    },
    {
      icon: Cpu,
      title: "Sentiment Analysis",
      description:
        "Understand public perception and emotional response to topics with automated sentiment classification.",
    },
    {
      icon: BarChart3,
      title: "Interactive Visualizations",
      description:
        "Real-time dashboards, network graphs, timeline visualizations with drill-down capabilities for detailed exploration.",
    },
  ];

  const technologies = [
    { name: "React", category: "Frontend" },
    { name: "TypeScript", category: "Language" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Motion", category: "Animation" },
    { name: "Recharts", category: "Visualization" },
    { name: "Python", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "scikit-learn", category: "ML" },
  ];

  const platforms = [
    { name: "Twitter/X", color: "#1DA1F2" },
    { name: "YouTube", color: "#FF0000" },
    { name: "Reddit", color: "#FF4500" },
    { name: "Google Trends", color: "#4285F4" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Colorful background orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-blue-400 to-cyan-400 opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-br from-indigo-400 to-violet-400 opacity-15 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-4 text-slate-900">About TrendMiner</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            A comprehensive social media trend analysis and pattern mining system that combines
            data warehousing, machine learning, and interactive visualizations
          </p>
        </motion.div>

        {/* Overview */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white border-slate-200 p-8 shadow-md">
            <h2 className="text-slate-900 mb-4">Project Overview</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              In today's digital landscape, social media platforms generate massive volumes of data
              every second. TrendMiner addresses the critical need for an intelligent system that
              can aggregate multi-platform social media data, discover hidden patterns in trending
              content, and provide personalized insights through advanced data mining algorithms.
            </p>
            <p className="text-slate-700 leading-relaxed">
              By combining robust backend architecture with an engaging frontend experience, this
              project bridges the gap between academic data mining concepts and practical,
              user-friendly applications.
            </p>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-900"
          >
            Key Features
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-200 p-6 h-full hover:border-indigo-400 hover:shadow-xl transition-all shadow-lg group">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-indigo-400 opacity-30 blur-xl rounded-xl" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-900"
          >
            Technologies Used
          </motion.h2>
          <Card className="bg-white border-slate-200 p-8 shadow-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {technologies.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="bg-slate-50 rounded-lg p-4 text-center"
                >
                  <div className="text-slate-900 mb-1">{tech.name}</div>
                  <div className="text-xs text-slate-600">{tech.category}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Data Sources */}
        <div className="mb-16">
          <motion.h2
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-slate-900"
          >
            Data Sources
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className="bg-white border-slate-200 p-6 text-center hover:border-slate-300 transition-colors shadow-md"
                  style={{ borderColor: platform.color + "20" }}
                >
                  <div
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: platform.color + "20" }}
                  >
                    <div className="text-2xl" style={{ color: platform.color }}>
                      {platform.name[0]}
                    </div>
                  </div>
                  <h3 className="text-slate-900">{platform.name}</h3>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white border-slate-200 p-8 shadow-md">
            <h2 className="text-slate-900 mb-6">Project Objectives</h2>
            <div className="space-y-4">
              {[
                "Design and implement a multi-dimensional data warehouse with optimized schema",
                "Develop ETL pipeline for extracting, transforming, and loading social media data",
                "Apply pattern mining algorithms to discover frequent itemsets and association rules",
                "Implement personalized recommendation engine based on user interests",
                "Perform sentiment analysis on trending content",
                "Create interactive visualizations for exploring trends and patterns",
              ].map((objective, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                  </div>
                  <p className="text-slate-700">{objective}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
