import React from 'react';
import Sidebar from '../NavBar/DashNavBar';
import './Dash_Acc.css';
import usePageMeta from '../../../../../hooks/usePageMeta';

const Dash_Acc: React.FC = () => {
  usePageMeta("Dashboard - Accounts", "HoKLibrary 128x128.png");
  
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="title-header">Account Dashboard</h1>
      </main>
    </div>
  );
};

export default Dash_Acc;