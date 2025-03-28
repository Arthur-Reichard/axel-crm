import React from "react";
import DashboardNavbar from "./DashboardNavbar";
import { Outlet } from "react-router-dom";

function DashboardLayout({ darkMode, toggleMode }) {
  return (
    <div className={`dashboard-layout ${darkMode ? "dark" : ""}`}>
      <DashboardNavbar darkMode={darkMode} toggleMode={toggleMode} />
      <Outlet />
    </div>
  );
}

export default DashboardLayout;
