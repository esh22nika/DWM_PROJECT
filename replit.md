# Interactive Trend Analysis Dashboard

## Overview
A full-stack web application that aggregates multi-platform social media data, discovers hidden patterns in trending content, and delivers personalized insights through advanced pattern mining and machine learning.

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Port**: 5000 (0.0.0.0)
- **Framework**: React 18 with Vite
- **UI Library**: Radix UI components with Tailwind CSS
- **Features**:
  - Personalized dashboard with real-time trend data
  - Interactive network graph visualization
  - Trend analysis and pattern mining
  - Topic explorer with filtering
  - Responsive design with modern animations

### Backend (Flask + Python)
- **Port**: 8080 (localhost)
- **Framework**: Flask with CORS enabled
- **Data Processing**: Pandas, NumPy, NLTK
- **Features**:
  - RESTful API endpoints for all dashboard pages
  - Advanced analytics and pattern mining
  - Sentiment analysis
  - Time-series trend detection
  - Topic co-occurrence analysis

### Data
- **Source**: `data/mock_social_trends_5000.csv`
- **Columns**: post_id, platform, user, content, hashtags, topic, likes, shares, comments, sentiment, timestamp, region
- **Platforms**: Twitter, YouTube, Reddit, Google

## API Endpoints

### Dashboard
- `GET /api/dashboard/summary` - Dashboard statistics and top topics
- `GET /api/dashboard/for-you?interests=ai,ev,coding&limit=20` - Personalized feed
- `GET /api/dashboard/stats` - Additional statistics

### Trends
- `GET /api/trends/overview?days=90` - Trend analysis (emerging, declining, peak)
- `GET /api/trends/platform-comparison?topic=AI` - Platform comparison

### Patterns
- `GET /api/patterns/top?limit=50` - Topic-phrase pattern rules
- `GET /api/patterns/graph` - Topic network graph

### Topics
- `GET /api/topics/list?query=ai` - Filtered topic list
- `GET /api/topics/detail?topic=AI` - Detailed topic information

## Recent Changes

### 2025-10-22: Initial Setup
- ✅ Set up Python 3.11 and Node.js 20
- ✅ Installed all dependencies (Flask, Pandas, React, etc.)
- ✅ Configured Vite to run on 0.0.0.0:5000 with API proxy
- ✅ Configured Flask backend on localhost:8080
- ✅ Moved CSV data to proper directory structure
- ✅ Fixed NLTK downloader exception handling
- ✅ Added missing `format_post_for_response` helper function
- ✅ Integrated frontend Dashboard with backend API
- ✅ Configured deployment for VM target

## Project Structure
```
.
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── styles/      # Global styles
│   ├── package.json
│   └── vite.config.ts
├── routes/              # Flask API routes
├── utils/               # Analytics and data utilities
├── data/                # CSV dataset
├── app.py              # Flask app initialization
├── run.py              # Backend entry point
├── start.sh            # Combined startup script
└── requirements.txt    # Python dependencies
```

## Running Locally
The project runs automatically via the workflow. Both frontend and backend start together:
- Frontend: http://localhost:5000
- Backend API: http://localhost:8080

## Development Notes
- The frontend uses a proxy to forward `/api` requests to the backend
- NLTK data (stopwords, punkt) is automatically downloaded on first run
- The backend uses in-memory Pandas DataFrames for fast analytics
- All API responses are cached using `@lru_cache` for performance

## User Preferences
None configured yet.

## Next Steps
- Add authentication
- Implement database migration (SQLite → PostgreSQL)
- Add real-time data updates
- Enhance pattern mining algorithms
- Add user preference storage
