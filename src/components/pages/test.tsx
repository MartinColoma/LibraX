import { useState } from "react";
import './test.css';

// Connect to Flask-SocketIO backend

type ChatMessage = { sender: "You" | "AI"; text: string };

export default function Members() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // 🔹 Chat API call
  const sendMessage = async () => {
    if (!message.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { sender: "You", text: message }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      // Add AI reply
      setChatHistory(prev => [
        ...prev,
        { sender: "AI", text: data.reply || "No response" },
      ]);
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        { sender: "AI", text: "⚠️ Error connecting to server" },
      ]);
    }

    setMessage(""); // clear input
  };

  return (
      <div className="chat-container">
        <h2>📚 Library Assistant</h2>

        <div className="chat-history">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble ${msg.sender === "You" ? "user" : "ai"}`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask the AI something..."
          />
          <button className="chat-button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
  );
}
