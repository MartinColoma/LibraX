import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage/Home';
import LoginPage from './components/pages/LandingPage/Login/LoginPage';
import LibDash_Home from './components/pages/Dashboards/LibrarianDashboard/Dashboard/Dash_Home';
import LibDash_Acc from './components/pages/Dashboards/LibrarianDashboard/Accounts/Dash_Acc';
import LibDash_BookInv from './components/pages/Dashboards/LibrarianDashboard/BookInventory/Dash_BookInv';
import LibDash_Pay from './components/pages/Dashboards/LibrarianDashboard/Payments/Dash_Payment';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/librarian/dashboard/home" element={<LibDash_Home />} />
      <Route path="/librarian/dashboard/accounts" element={<LibDash_Acc />} />
      <Route path="/librarian/dashboard/book-inventory" element={<LibDash_BookInv />} />
      <Route path="/librarian/dashboard/payments" element={<LibDash_Pay />} />


    </Routes>
  );
};

export default AppRoutes;
