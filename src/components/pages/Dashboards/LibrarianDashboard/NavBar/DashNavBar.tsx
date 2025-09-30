import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  // CreditCard,
//  ClipboardCheck,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./DashNavBar.css";
import SwitchAccountModal from "./Modals/SwitchAccountModal";
import CreateAccountModal from "./Modals/CreateAccountModal";
import axios from "axios";

// Define prop types (optional, in case we want to notify parent on collapse)
interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapse }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    sessionStorage.getItem("sidebarCollapsed") === "true"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

 const [staffName, setStaffName] = useState(
  sessionStorage.getItem("user_name") || "Unknown User"
);

  // Listen for storage changes (optional: if login changes in another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setStaffName(sessionStorage.getItem("user_name") || "Unknown User");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      path: "/librarian/dashboard/home",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Manage Users",
      path: "/librarian/dashboard/accounts",
      icon: <Users size={18} />,
    },
    {
      name: "Book Inventory",
      path: "/librarian/dashboard/book-inventory",
      icon: <BookOpen size={18} />,
    },
    // {
    //   name: "Payments",
    //   path: "/librarian/dashboard/payments",
    //   icon: <CreditCard size={18} />,
    // },
    // {
    //   name: "Reservation",
    //   path: "/librarian/dashboard/reservation",
    //   icon: <ClipboardCheck size={18} />,
    // },
  ];

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    sessionStorage.setItem("sidebarCollapsed", String(newState));
    if (onCollapse) onCollapse(newState); // Notify parent if needed
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5001/auth/logout", {}, { withCredentials: true });
      sessionStorage.removeItem("user_name");
      localStorage.removeItem("staff");
      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isSwitchAccountModal =
    location.pathname === "/librarian/dashboard/switch-account";
  const isCreateAccountModal =
    location.pathname === "/librarian/dashboard/create-account";

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            📚 <span className="logo-text">LibraX AIoT Kiosk  </span>
          </div>

          {/* Floating Collapse Button */}
          <button className="collapse-btn floating" onClick={toggleCollapsed}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
              data-tooltip={item.name} // Tooltip text
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" ref={dropdownRef}>
          <div className="user-info">
            <div className="username">
              <small>Logged in as</small>
              <div className="staff-name">{staffName}</div>
            </div>
            <button className="menu-toggle-btn" onClick={toggleMenu}>
              <MoreHorizontal size={20} />
            </button>
          </div>

          {menuOpen && (
            <div className="user-dropdown">
              {/* Show logged in user name only if collapsed */}
              {collapsed && (
                <div className="dropdown-user">
                  {staffName}
                </div>
              )}

              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/librarian/dashboard/switch-account", {
                    state: { backgroundLocation: location },
                  });
                }}
              >
                Switch Account
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/librarian/dashboard/create-account", {
                    state: { backgroundLocation: location },
                  });
                }}
              >
                Create Account
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}

        </div>
      </aside>

      {isSwitchAccountModal && (
        <SwitchAccountModal
          onClose={() =>
            navigate(
              location.state?.backgroundLocation ||
                "/librarian/dashboard/home"
            )
          }
        />
      )}

      {isCreateAccountModal && (
        <CreateAccountModal
          onClose={() =>
            navigate(
              location.state?.backgroundLocation ||
                "/librarian/dashboard/home"
            )
          }
        />
      )}
    </>
  );
};

export default Sidebar;
