from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend

@app.route('/')
def home():
    return "Flask backend is running!"

@app.route('/process', methods=['POST'])
def process_text():
    data = request.json
    text = data.get("text", "")
    processed_text = text.upper()  # Example processing
    return jsonify({"processed_text": processed_text})

if __name__ == '__main__':
    app.run(debug=True)
