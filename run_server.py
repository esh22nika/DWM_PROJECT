"""
Simple server runner for TrendMiner backend
"""

from app import app
import os

if __name__ == "__main__":
    # Get port from environment or default to 5000
    port = int(os.environ.get("PORT", 5000))

    print("=" * 50)
    print("TrendMiner Backend Server Starting...")
    print("=" * 50)
    print(f"Server running on: http://localhost:{port}")
    print(f"API endpoints available at: http://localhost:{port}/api/")
    print("=" * 50)

    # Run the Flask app
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=True)
