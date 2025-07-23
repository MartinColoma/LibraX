import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Welcome to the Landing Page</h1>
      <p className={styles.paragraph}>This is the home component styled in dark mode.</p>
      <button className={styles.button} onClick={handleRedirect}>
        Go to Login
      </button>
    </div>
  );
};

export default Home;
