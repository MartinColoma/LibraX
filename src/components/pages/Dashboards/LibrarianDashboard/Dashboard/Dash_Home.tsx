import React from 'react';
import styles from './Dash_Home.module.css';
import usePageMeta from '../../../../../hooks/usePageMeta';

const Dash_Home: React.FC = () => {
  usePageMeta("Librarian - Dashboard", "HoKLibrary 128x128.png");

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Library Dashboard</h1>
    </div>
  );
};

export default Dash_Home;