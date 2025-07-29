import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
//Pages
import LandingPage from './components/pages/LandingPage/Home';
import LoginPage from './components/pages/LandingPage/Login/LoginPage';
import LibDash_Home from './components/pages/Dashboards/LibrarianDashboard/Dashboard/Dash_Home';
import LibDash_Acc from './components/pages/Dashboards/LibrarianDashboard/Accounts/Dash_Acc';
import LibDash_BookInv from './components/pages/Dashboards/LibrarianDashboard/BookInventory/Dash_BookInv';
import LibDash_Pay from './components/pages/Dashboards/LibrarianDashboard/Payments/Dash_Payment';
import ADash_Home from './components/pages/Dashboards/AdminDashboard/Dashboard/AD_Home';
//Modals
import SwitchAccountModal from './components/pages/Dashboards/LibrarianDashboard/NavBar/Modals/SwitchAccountModal';
import CreateAccountModal from './components/pages/Dashboards/LibrarianDashboard/NavBar/Modals/CreateAccountModal';

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // @ts-ignore
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* librarian dashboard routes */}
        <Route path="/librarian/dashboard/home" element={<LibDash_Home />} />
        <Route path="/librarian/dashboard/accounts" element={<LibDash_Acc />} />
        <Route path="/librarian/dashboard/book-inventory" element={<LibDash_BookInv />} />
        <Route path="/librarian/dashboard/payments" element={<LibDash_Pay />} />
        {/* admin dashboard routes */}
        <Route path="/admin/dashboard/home" element={<ADash_Home />} />

      </Routes>

      {/* Modal Route Overlay */}
      {background && (
        <Routes>
          <Route
            path="/librarian/dashboard/switch-account"
            element={createPortal(
              <SwitchAccountModal onClose={() => window.history.back()} />,
              document.body
            )}
          />
          <Route
            path="/librarian/dashboard/create-account"
            element={createPortal(
              <CreateAccountModal onClose={() => window.history.back()} />,
              document.body
            )}
          />
        </Routes>
      )}
    </>
  );
};
export default AppRoutes;