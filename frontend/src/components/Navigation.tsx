import { TrendingUp, LayoutDashboard, Network, BarChart3, Search, User, Info } from "lucide-react";
import { motion } from "framer-motion";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const navItems = [
    { id: "landing", label: "Home", icon: TrendingUp },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patterns", label: "Pattern Mining", icon: Network },
    { id: "analysis", label: "Trend Analysis", icon: BarChart3 },
    //{ id: "explorer", label: "Topic Explorer", icon: Search },
    { id: "profile", label: "Profile", icon: User },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-lg border-b-2 border-gradient sticky top-0 z-50 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="max-w-7xl mx-auto px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate("landing")}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              TrendMiner
            </span>
          </motion.div>

          <div className="flex gap-1">
            {navItems.slice(1).map((item) => {
              const isActive = currentPage === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-transparent bg-clip-text shadow-md"
                      : "text-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-slate-900"
                  }`}
                  style={isActive ? {
                    backgroundImage: "linear-gradient(90deg, #3B82F6, #8B5CF6, #EC4899)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text"
                  } : {}}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
