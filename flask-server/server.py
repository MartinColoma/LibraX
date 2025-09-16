# server.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from gemini_chatbot import chat_with_gemini  # ✅ import AI function

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Chat with Gemini AI
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    reply = chat_with_gemini(user_message)
    return jsonify({"reply": reply})



if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=2000, debug=True)
