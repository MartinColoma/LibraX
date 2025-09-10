import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

// Pages
import PageNotFound from './components/pages/PageNotFound';
import DbTest from './components/pages/BookTest';
import LandingPage from './components/pages/LandingPage/Home/Home';
import LibDash_Home from './components/pages/Dashboards/LibrarianDashboard/Dashboard/Dash_Home';
import LibDash_Acc from './components/pages/Dashboards/LibrarianDashboard/Accounts/Dash_Acc';
import LibDash_BookInv from './components/pages/Dashboards/LibrarianDashboard/BookInventory/Dash_BookInv';
import LibDash_Pay from './components/pages/Dashboards/LibrarianDashboard/Payments/Dash_Payment';
import LibDash_Reserve from './components/pages/Dashboards/LibrarianDashboard/Reservation/Dash_Reserve';

// Modals
import LoginModal from './components/pages/LandingPage/Login/LoginModal';
import SwitchAccountModal from './components/pages/Dashboards/LibrarianDashboard/NavBar/Modals/SwitchAccountModal';
import CreateAccountModal from './components/pages/Dashboards/LibrarianDashboard/NavBar/Modals/CreateAccountModal';

// ✅ New: Full-page LoginPage using the same LoginModal
const LoginPage: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#000",
      }}
    >
      <LoginModal onClose={() => { window.history.back(); }} />
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const location = useLocation();

  // @ts-ignore
  const state = location.state as { backgroundLocation?: Location };
  const background = state?.backgroundLocation;

  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hok-library-v2" element={<LandingPage />} />
        <Route path='*' element={<PageNotFound />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/db" element={<DbTest />} />

        {/* librarian dashboard routes */}
        <Route path="/librarian/dashboard/home" element={<LibDash_Home />} />
        <Route path="/librarian/dashboard/accounts" element={<LibDash_Acc />} />
        <Route path="/librarian/dashboard/book-inventory" element={<LibDash_BookInv />} />
        <Route path="/librarian/dashboard/payments" element={<LibDash_Pay />} />
        <Route path="/librarian/dashboard/reservation" element={<LibDash_Reserve />} />

      </Routes>

      {/* Modal Route Overlay */}
      {background && (
        <Routes>
          <Route
            path="/login"
            element={createPortal(
              <LoginModal onClose={() => window.history.back()} />,
              document.body
            )}
          />
          {/* librarian dashboard modal routes */}
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
