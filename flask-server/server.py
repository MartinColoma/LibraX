from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initial data
members = ["Karl Iligan", "Kent Arado", "Martin Coloma", "Earl Liporada", "Paul De Belliena", "Angel Delera"]

# REST endpoint to get current members (does NOT emit)
@app.route("/api/members")
def get_members():
    return jsonify({"members": members})

# Add a member and emit the update to all connected clients
@app.route("/api/add_member/<name>")
def add_member(name):
    members.append(name)
    socketio.emit("members_update", {"members": members})  # ✅ emit to all clients
    return jsonify({"status": "ok", "members": members})

# Emit current members when a client connects
@socketio.on("connect")
def handle_connect():
    emit("members_update", {"members": members})

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
