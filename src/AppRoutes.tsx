import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage/Home';
import LoginPage from './components/pages/LandingPage/Login/LoginPage';
import LibDash from './components/pages/Dashboards/LibrarianDashboard/Dashboard/Dash_Home';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/librarian/dashboard" element={<LibDash />} />
    </Routes>
  );
};

export default AppRoutes;
