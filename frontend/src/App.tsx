import { useState } from "react";
import { Navigation } from "components/Navigation";
import { Landing } from "pages/Landing";
import Dashboard from "pages/Dashboard";
import { PatternMining } from "pages/PatternMining";
import { TrendAnalysis } from "pages/TrendAnalysis";
import { TopicExplorer } from "pages/TopicExplorer";
import { Profile } from "pages/Profile";
import { About } from "pages/About";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <Landing onNavigate={setCurrentPage} />;
      case "dashboard":
        return <Dashboard />;
      case "patterns":
        return <PatternMining />;
      case "analysis":
        return <TrendAnalysis />;
      case "explorer":
        return <TopicExplorer />;
      case "profile":
        return <Profile />;
      case "about":
        return <About />;
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen">
      {currentPage !== "landing" && (
        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}
      {renderPage()}
    </div>
  );
}
