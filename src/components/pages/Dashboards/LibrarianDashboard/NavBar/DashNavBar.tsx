// src/components/Sidebar.tsx
import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard
} from 'lucide-react';
import './DashNavBar.css';
import SwitchAccountModal from './Modals/SwitchAccountModal';

const Sidebar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/librarian/dashboard/home', icon: <LayoutDashboard size={18} /> },
    { name: 'Accounts', path: '/librarian/dashboard/accounts', icon: <Users size={18} /> },
    { name: 'Book Inventory', path: '/librarian/dashboard/book-inventory', icon: <BookOpen size={18} /> },
    { name: 'Payments', path: '/librarian/dashboard/payments', icon: <CreditCard size={18} /> }
  ];

  const toggleMenu = () => setMenuOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSwitchAccountModal = location.pathname === '/librarian/dashboard/switch-account';

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">📚 <span>HokLibrary</span></div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" ref={dropdownRef}>
          <div className="user-info" onClick={toggleMenu}>
            <small>Logged in as</small>
            <div className="username clickable">Librarian_No.1 ▾</div>
          </div>

          {menuOpen && (
            <div className="user-dropdown">
              <button
                className="dropdown-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/librarian/dashboard/switch-account', {
                    state: { backgroundLocation: location }
                  });
                }}
              >
                Switch Account
              </button>
              <button className="dropdown-item">Create Account</button>
              <button className="dropdown-item" onClick={() => navigate('/login')}>Logout</button>
            </div>
          )}
        </div>
      </aside>

      {isSwitchAccountModal && (
        <SwitchAccountModal
          onClose={() => navigate(location.state?.backgroundLocation || '/librarian/dashboard/home')}
        />
      )}
    </>
  );
};

export default Sidebar;
