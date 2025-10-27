from flask import Flask
from flask_cors import CORS
from routes.dashboard import dashboard_bp
from routes.trends import trends_bp
from routes.patterns import patterns_bp
from routes.topics import topics_bp
from utils.data_loader import DataStore


def create_app():
    app = Flask(__name__)
    _ = CORS(app)

    # Load data using the DataStore class
    try:
        app.config["DATASTORE"] = DataStore(
            csv_path="frontend/public/data/mock_social_trends_5000.csv"
        )
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure the CSV file is in the 'data' directory.")
        # Depending on the desired behavior, you might want to exit or handle this differently.
        # For now, we'll continue with an empty DataFrame to allow the app to start.
        import pandas as pd
        from collections import defaultdict

        class EmptyDataStore:
            def __init__(self):
                self.df = pd.DataFrame()
                self.topics = {}
                self.topic_mentions = defaultdict(list)

        app.config["DATASTORE"] = EmptyDataStore()

    # register blueprints
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(trends_bp, url_prefix="/api/trends")
    app.register_blueprint(patterns_bp, url_prefix="/api/patterns")
    app.register_blueprint(topics_bp, url_prefix="/api/topics")

    @app.route("/health")
    def health():
        """Health check endpoint."""
        return {"status": "ok"}

    return app


app = create_app()
