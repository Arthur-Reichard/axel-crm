import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../pages/Images/logoaxel.png";
import { supabase } from "../helper/supabaseClient";
import UserMenu from "./UserMenu";
import "../pages/css/DashboardNavbar.css";

function DashboardNavbar({ darkMode, toggleMode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erreur de déconnexion :", error);
    else navigate("/login");
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className={darkMode ? "top-navbar dark" : "top-navbar"}>
      <div className="nav-wrapper">
        <div className="left-nav">
          <NavLink to="/dashboard">
            <img src={logo} alt="Logo" className="nav-logo" />
          </NavLink>
        </div>

        <div className="right-nav">
          <button className="burger-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>

          <UserMenu darkMode={darkMode} toggleMode={toggleMode} />
        </div>
      </div>

      <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
        <li><NavLink to="/dashboard" className="nav-link" onClick={handleLinkClick}>Dashboard</NavLink></li>
        <li><NavLink to="/leads" className="nav-link" onClick={handleLinkClick}>Leads</NavLink></li>
        <li><NavLink to="/clients" className="nav-link" onClick={handleLinkClick}>Clients</NavLink></li>
        <li><NavLink to="/stats" className="nav-link" onClick={handleLinkClick}>Statistiques</NavLink></li>
        <li><NavLink to="/calendar" className="nav-link" onClick={handleLinkClick}>Calendrier</NavLink></li>
        <li><NavLink to="/materiel" className="nav-link" onClick={handleLinkClick}>Parc Matériel</NavLink></li>
        <li><NavLink to="/factures" className="nav-link" onClick={handleLinkClick}>Factures</NavLink></li>
        <li><NavLink to="/MyUserProfil" className="nav-link" onClick={handleLinkClick}>Mon Profil</NavLink></li>
      </ul>
    </nav>
  );
}

export default DashboardNavbar;
