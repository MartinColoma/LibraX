# server.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from gemini_chatbot import chat_with_gemini  # ✅ import AI function

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initial data
members = ["Karl Iligan", "Kent Arado", "Martin Coloma", "Earl Liporada", "Paul De Belliena"]

# REST endpoint to get current members (does NOT emit)
@app.route("/api/members")
def get_members():
    return jsonify({"members": members})

# Add a member and emit the update to all connected clients
@app.route("/api/add_member/<name>")
def add_member(name):
    members.append(name)
    socketio.emit("members_update", {"members": members})
    return jsonify({"status": "ok", "members": members})

# Chat with Gemini AI
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    reply = chat_with_gemini(user_message)
    return jsonify({"reply": reply})

# Emit current members when a client connects
@socketio.on("connect")
def handle_connect():
    emit("members_update", {"members": members})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
