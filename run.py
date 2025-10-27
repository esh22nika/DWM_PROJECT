import os
from app import create_app
from flask import send_from_directory

# create flask app
app = create_app()

# Serve React build files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    static_folder = os.path.join(os.getcwd(), 'frontend', 'dist')
    if not os.path.exists(static_folder):
        static_folder = os.path.join(os.getcwd(), 'frontend', 'build')
    if path != "" and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    return send_from_directory(static_folder, 'index.html')

# Run app for Render
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
