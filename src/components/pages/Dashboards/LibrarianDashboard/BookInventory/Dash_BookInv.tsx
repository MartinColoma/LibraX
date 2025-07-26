import React from 'react';
import Sidebar from '../NavBar';
import './Dash_BookInv.css';
import usePageMeta from '../../../../../hooks/usePageMeta';

const Dash_BookInv: React.FC = () => {
  usePageMeta("Dashboard - Book Inventory", "HoKLibrary 128x128.png");
  
  return (
    <div className="page-layout">
      <Sidebar />
      <main className="main-content">
        <h1 className="title-header">Book Inventory</h1>
      </main>
    </div>
  );
};

export default Dash_BookInv;