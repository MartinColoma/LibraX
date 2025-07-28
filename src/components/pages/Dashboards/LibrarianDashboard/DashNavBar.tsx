import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard
} from 'lucide-react';
import './DashNavBar.css';

const Sidebar = () => {
  const navItems = [
    {
      name: 'Dashboard',
      path: '/librarian/dashboard/home',
      icon: <LayoutDashboard size={18} />
    },
    {
      name: 'Accounts',
      path: '/librarian/dashboard/accounts',
      icon: <Users size={18} />
    },
    {
      name: 'Book Inventory',
      path: '/librarian/dashboard/book-inventory',
      icon: <BookOpen size={18} />
    },
    {
      name: 'Payments',
      path: '/librarian/dashboard/payments',
      icon: <CreditCard size={18} />
    }
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
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

      <div className="sidebar-footer">
        <div className="user-info">
          <small>Logged in as</small>
          <div className="username">Librarian_No.1</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
