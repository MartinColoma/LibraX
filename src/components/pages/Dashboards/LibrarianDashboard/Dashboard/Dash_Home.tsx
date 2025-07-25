import React from 'react';
import styles from './Dash_Home.module.css';

const Dash_Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Library Dashboard</h1>
    </div>
  );
};

export default Dash_Home;