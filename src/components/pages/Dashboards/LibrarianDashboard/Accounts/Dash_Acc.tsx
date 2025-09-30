import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../NavBar/DashNavBar";
import "./Dash_Acc.css";
import usePageMeta from "../../../../../hooks/usePageMeta";
import CreateAccountModal from "./Modals/Create_NewMem"; // <-- import modal

const Dash_Acc: React.FC = () => {
  usePageMeta("Dashboard - Accounts", "HoKLibrary 128x128.png");

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    sessionStorage.getItem("sidebarCollapsed") === "true"
  );
  const [showModal, setShowModal] = useState(false); // ✅ modal state

  const navigate = useNavigate();
    useEffect(() => {
      const userType = sessionStorage.getItem("user_type");
      if (userType !== "staff") {
        navigate("/login", { replace: true });
      }
    }, [navigate]);

  return (
    <div className="page-layout">
      <Sidebar
        onCollapse={(state: boolean) => {
          setSidebarCollapsed(state);
          sessionStorage.setItem("sidebarCollapsed", String(state));
          window.dispatchEvent(new Event("storage")); // trigger other tabs/pages
        }}
      />

      <main
        className="main-content"
        style={{
          marginLeft: sidebarCollapsed ? "85px" : "240px",
          transition: "margin 0.3s ease",
        }}
      >
        <div className="header-row">
          <h1 className="title-header">Accounts Dashboard</h1>
          <button
            className="btn-create"
            onClick={() => setShowModal(true)}
          >
            + Create New Member
          </button>
        </div>

        {/* Modal Mount */}
        {showModal && <CreateAccountModal onClose={() => setShowModal(false)} />}
      </main>
    </div>
  );
};

export default Dash_Acc;
