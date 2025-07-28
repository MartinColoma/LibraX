import React from 'react';
import Sidebar from '../NavBar/DashNavBar';
import './Dash_Payment.css';
import usePageMeta from '../../../../../hooks/usePageMeta';

const Dash_Payment: React.FC = () => {
  usePageMeta("Dashboard - Payments", "HoKLibrary 128x128.png");
  
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="title-header">Payments</h1>
      </main>
    </div>
  );
};

export default Dash_Payment;