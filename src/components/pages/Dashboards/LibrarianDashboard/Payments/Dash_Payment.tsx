import React, { useState } from "react";
import Sidebar from '../NavBar/DashNavBar';
import './Dash_Payment.css';
import usePageMeta from '../../../../../hooks/usePageMeta';


const Dash_Payment: React.FC = () => {
  usePageMeta("Dashboard - Home", "HoKLibrary 128x128.png");
    // ✅ Track sidebar collapse state (listen via storage or context)
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
      sessionStorage.getItem("sidebarCollapsed") === "true"
    );

  return (
    <div className="page-layout">
      <Sidebar onCollapse={(state: boolean) => {
        setSidebarCollapsed(state);
        sessionStorage.setItem("sidebarCollapsed", String(state));
        window.dispatchEvent(new Event("storage")); // trigger other tabs/pages
      }} />
      
      <main
        className="main-content"
        style={{
          marginLeft: sidebarCollapsed ? "85px" : "240px", // ✅ shift content
          transition: "margin 0.3s ease",
        }}
      >
        <h1 className="title-header">Payments Dashboard</h1>

      </main>
    </div>
  );
};

export default Dash_Payment;