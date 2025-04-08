import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../pages/Images/logoaxel.png";
import { supabase } from "../helper/supabaseClient";
import UserMenu from "./UserMenu";

function DashboardNavbar({ darkMode, toggleMode }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erreur de déconnexion :", error);
    else navigate("/login");
  };

  return (
    <nav className={darkMode ? "top-navbar dark" : "top-navbar"}>
      <div className="left-nav">
        <NavLink to="/dashboard">
          <img src={logo} alt="Logo" className="nav-logo" />
        </NavLink>
        <ul className="nav-links">
          <li><NavLink to="/dashboard" className="nav-link">Dashboard</NavLink></li>
          <li><NavLink to="/leads" className="nav-link">Leads</NavLink></li>
          <li><NavLink to="/clients" className="nav-link">Clients</NavLink></li>
          <li><NavLink to="/stats" className="nav-link">Statistiques</NavLink></li>
          <li><NavLink to="/calendar" className="nav-link">Calendrier</NavLink></li>
          <li><NavLink to="/materiel" className="nav-link">Parc Matériel</NavLink></li>
          <li><NavLink to="/factures" className="nav-link">Factures</NavLink></li>
        </ul>
      </div>

      <div className="right-nav">
        <UserMenu darkMode={darkMode} toggleMode={toggleMode} />
      </div>
    </nav>
  );
}

export default DashboardNavbar;
