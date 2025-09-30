import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from '../NavBar/DashNavBar';
import './Dash_Reserve.css';
import usePageMeta from '../../../../../hooks/usePageMeta';


const Dash_Reserve: React.FC = () => {
  usePageMeta("Dashboard - Reservation", "HoKLibrary 128x128.png");
    // ✅ Track sidebar collapse state (listen via storage or context)
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
      sessionStorage.getItem("sidebarCollapsed") === "true"
    );
    const navigate = useNavigate();
     useEffect(() => {
       const userType = sessionStorage.getItem("user_type");
       if (userType !== "staff") {
         navigate("/login", { replace: true });
       }
     }, [navigate]);
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
        <h1 className="title-header">Reserve A Seat</h1>

      </main>
    </div>
  );
};

export default Dash_Reserve;