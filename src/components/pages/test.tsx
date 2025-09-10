import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import './test.css';

// Connect to Flask-SocketIO backend
const socket = io("http://localhost:5000"); // replace with Raspberry Pi IP if running on Pi

export default function Members() {
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    // Fetch initial members in case socket connection is delayed
    fetch("/api/members")
      .then(res => res.json())
      .then(data => setMembers(data.members || []));

    // Listen for live updates from backend
    socket.on("members_update", (data: { members: string[] }) => {
      setMembers(data.members);
    });

    // Re-fetch data on socket reconnect
    socket.on("connect", () => {
      fetch("/api/members")
        .then(res => res.json())
        .then(data => setMembers(data.members || []));
    });

    return () => {
      socket.off("members_update");
      socket.off("connect");
    };
  }, []);

  return (
    <div className="members-container">
      <h1>Members</h1>
      <ul>
        {members.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
