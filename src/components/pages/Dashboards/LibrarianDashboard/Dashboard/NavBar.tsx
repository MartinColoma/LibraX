// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/librarian/dashboard/home' },
    { name: 'Accounts', path: '/librarian/dashboard/accounts' },
    { name: 'Books', path: '/librarian/dashboard/book-inventory' },
    { name: 'Payments', path: '/librarian/dashboard/payments' }
  ];

  const navigate = useNavigate();
  const handleCancel = () => {
    navigate('/'); // Back to home
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
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <small>Logged in as</small>
          <div className="username">Librarian_No.1</div>
        </div>
        <button className="logout-btn"
        onClick={handleCancel}
        >
            Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
