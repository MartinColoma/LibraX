import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, BookOpen, ClipboardCheck, LayoutDashboard, Bell, LogOut } from "lucide-react";
import axios from "axios";
import "./Sidebar.css";

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const SimpleSidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState(sessionStorage.getItem("user_name") || "Unknown User");

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onCollapse) onCollapse(newState);
  };

  // Update username if sessionStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setUsername(sessionStorage.getItem("user_name") || "Unknown User");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navItems = [
    { name: "Home", path: "/member/dashboard/home", icon: <LayoutDashboard size={18} /> },
    { name: "My Books", path: "/member/dashboard/books", icon: <BookOpen size={18} /> },
    { name: "Reservations", path: "/member/dashboard/reservations", icon: <ClipboardCheck size={18} /> },
    { name: "Library News", path: "/member/dashboard/news", icon: <Bell size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/auth/logout", {}, { withCredentials: true });
      sessionStorage.removeItem("user_name");
      localStorage.removeItem("member");
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          📚 <span className="logo-text">{collapsed ? "" : "Library"}</span>
        </div>
        <button className="collapse-btn" onClick={toggleCollapse}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        {!collapsed && <div className="username">{username}</div>}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default SimpleSidebar;
