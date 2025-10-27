import { motion } from "framer-motion";
import { NetworkGraph } from "../components/NetworkGraph";
import { TrendingUp, Database, Brain, Target, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

interface LandingProps {
  onNavigate: (page: string) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-300 opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 opacity-30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-orange-300 to-yellow-300 opacity-20 rounded-full blur-3xl" />

        {/* Hero Content */}
        <div className="relative z-10 px-8 pt-20 pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 border-2 border-purple-300 rounded-full mb-6 shadow-md">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ✨ Powered by AI & Data Mining
                  </span>
                </div>
              </motion.div>

              <motion.h1
                className="mb-6 text-slate-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Discover Social Media Trends
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Personalized Just For You
                </span>
              </motion.h1>

              <motion.p
                className="text-xl text-slate-600 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                An intelligent system that aggregates multi-platform social media data,
                discovers hidden patterns in trending content, and delivers personalized
                insights through advanced pattern mining and machine learning.
              </motion.p>

              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                  onClick={() => onNavigate("dashboard")}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => onNavigate("about")}
                >
                  Learn More
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Network Visualization Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-slate-900">Explore Trending Topics</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Interact with the network below. Hover over nodes to see connections
              and discover how topics co-trend across different platforms.
            </p>
          </motion.div>

          {/* Interactive Network Container */}
          <motion.div
            className="relative bg-white rounded-3xl border border-slate-200 p-8 overflow-hidden shadow-xl"
            style={{ height: "600px" }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <NetworkGraph />
          </motion.div>

          <motion.p
            className="text-center text-slate-500 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            💡 Hover over nodes to see connections • Click for details
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-slate-900">Powerful Features</h2>
            <p className="text-xl text-slate-600">
              Advanced data mining meets intuitive user experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: "Multi-Platform Warehousing",
                description:
                  "Aggregate data from Twitter/X, YouTube, Reddit, and Google Trends in a structured, queryable format",
                color: "blue",
              },
              {
                icon: Brain,
                title: "Pattern Mining",
                description:
                  "Discover hidden patterns using Apriori, FP-Growth, and Sequential Pattern Mining algorithms",
                color: "purple",
              },
              {
                icon: Target,
                title: "Personalized Recommendations",
                description:
                  "Get trend recommendations tailored to your interests with intelligent filtering",
                color: "pink",
              },
              {
                icon: TrendingUp,
                title: "Trend Analysis",
                description:
                  "Track trend lifecycle stages from emerging to peak to declining with temporal patterns",
                color: "cyan",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-200 to-${feature.color}-100 opacity-50 rounded-2xl blur-xl group-hover:blur-2xl group-hover:opacity-70 transition-all`} />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-gradient p-6 h-full hover:scale-105 transition-all shadow-xl" style={{
                  borderImage: `linear-gradient(135deg, var(--tw-gradient-stops)) 1`,
                  borderImageSlice: 1
                }}>
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-${feature.color}-400 opacity-20 blur-xl rounded-xl`} />
                    <div
                      className={`relative w-12 h-12 bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-600 rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="mb-2 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="relative bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl p-[2px] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 opacity-50 blur-2xl" />
            <div className="relative bg-white rounded-3xl p-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {[
                { value: "4+", label: "Social Platforms" },
                { value: "1M+", label: "Trends Analyzed" },
                { value: "95%", label: "Pattern Accuracy" },
                { value: "24/7", label: "Real-time Updates" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-slate-700">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-slate-900">Ready to Mine Your Trends?</h2>
            <p className="text-xl text-slate-600 mb-8">
              Join thousands of users discovering personalized insights from social media data
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg"
              onClick={() => onNavigate("dashboard")}
            >
              Start Exploring Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-8 py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center text-slate-600">
          <p>© 2025 TrendMiner. Powered by advanced data mining & machine learning.</p>
        </div>
      </footer>
    </div>
  );
}
