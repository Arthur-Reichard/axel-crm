import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../pages/Images/logoaxel.png";
import supabase from "../helper/supabaseClient";
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
        <Link to="/dashboard">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>
        <ul className="nav-links">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/leads">Leads</Link></li>
          <li><Link to="/clients">Clients</Link></li>
          <li><Link to="/stats">Statistiques</Link></li>
        </ul>
      </div>

      <div className="right-nav">
        <button onClick={toggleMode} className="mode-button">
          {darkMode ? "Mode clair" : "Mode sombre"}
        </button>
        <button onClick={handleLogout} className="btn outline">
          Déconnexion
        </button>
      </div>

      <div className="right-nav">
        <UserMenu darkMode={darkMode} toggleMode={toggleMode} />
      </div>
    </nav>
  );
}

export default DashboardNavbar;
