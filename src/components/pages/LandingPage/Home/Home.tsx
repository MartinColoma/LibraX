import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import './/Home.css';
import usePageMeta from '../../../../hooks/usePageMeta';
import LoginPage from '../Login/LoginModal';

const Home: React.FC = () => {
  usePageMeta("Honor of Knowledge Library", "HoKLibrary 128x128.png");
  const navigate = useNavigate();

  const handleRedirect = (path: string) => {
    navigate(path);
  };
  const location = useLocation();

  const loginmodal = location.pathname === '/login';

  return (
    <>
    <div className="landing-page">
      <div className="landing-background">
        <div className="landing-gradient"></div>
      </div>
      {/* Top right login button */}
      <div className="landing-top-right-controls">
        <button className="login-btn" onClick={() => {
          navigate('/login', {
            state: { backgroundLocation: location }
          });
        }}>
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

      {loginmodal && (
        <LoginPage
          onClose={() =>
            navigate(location.state?.backgroundLocation || '/login')
          }
        />
      )}
  
  </>
  );
};

export default Home;
