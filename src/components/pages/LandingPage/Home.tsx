import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import './/Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleRedirect = (path: string) => {
    navigate(path);
  };

  return (
    <div className="landing-page">
      <div className="landing-background">
        <div className="landing-gradient"></div>
      </div>
      {/* Top right login button */}
      <div className="landing-top-right-controls">
        <button className="login-btn" onClick={() => handleRedirect('/login')}>
          {/* <LogIn size={24} /> */}
          Login
        </button>
      </div>

      {/* Page header */}
      <div className="title-section">
        <h1 className="main-title">
          HONOR OF <br />
          KNOWLEDGE<br />
          LIBRARY
        </h1>
        <p className="subtitle">Management System</p>
      </div>

      {/* Member and Guest buttons */}
      <div className="button-container">
        <button
          className="landing-btn member-btn"
          onClick={() => handleRedirect('/member')}
        >
          <User size={24} />
          MEMBER
        </button>

        <button
          className="landing-btn guest-btn"
          onClick={() => handleRedirect('/guest')}
        >
          <Users size={24} />
          GUEST
        </button>
      </div>
    </div>
  );
};

export default Home;
