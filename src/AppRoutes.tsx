import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage/Home';
import LoginPage from './components/pages/LandingPage/Login/LoginPage';
import LibDash from './components/pages/Dashboards/LibrarianDashboard/Dashboard/Dash_Home';
import LibDash_NavBar from './components/pages/Dashboards/LibrarianDashboard/Dashboard/NavBar';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/librarian/dashboard" element={<LibDash />} />
      <Route path="/librarian/dashboard/nav" element={<LibDash_NavBar />} />

    </Routes>
  );
};

export default AppRoutes;
