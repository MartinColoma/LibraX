import React from 'react';
import Sidebar from '../DashNavBar';
import './Dash_Home.css';
import usePageMeta from '../../../../../hooks/usePageMeta';

const Dash_Home: React.FC = () => {
  usePageMeta("Dashboard - Home", "HoKLibrary 128x128.png");
  
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="title-header">Library Dashboard</h1>
      </main>
    </div>
  );
};

export default Dash_Home;