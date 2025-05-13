import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import UserMenu from "./UserMenu";
import "../pages/css/DashboardNavbar.css";
import defaultLogo from "../pages/Images/logoaxel.png";

function DashboardNavbar({ darkMode, toggleMode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [navbarColor, setNavbarColor] = useState("var(--color-navbar)");
  const [navbarTextColor, setNavbarTextColor] = useState("#FFFFFF");

  useEffect(() => {
    const fetchParametres = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

    const { data, error } = await supabase
      .from("parametres_interface")
      .select("logo_url, couleur_navbar, couleur_texte_navbar")
      .eq("utilisateur_id", user.id)
      .maybeSingle();

      if (error) {
        console.error("Erreur récupération paramètres :", error.message);
        return;
      }

      if (data) {
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.couleur_navbar) setNavbarColor(data.couleur_navbar);
        if (data.couleur_texte_navbar) setNavbarTextColor(data.couleur_texte_navbar);
      }
    };

    fetchParametres();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erreur de déconnexion :", error);
    else navigate("/login");
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
      <nav
        className={darkMode ? "top-navbar dark" : "top-navbar"}
        style={{ backgroundColor: navbarColor, color: navbarTextColor }}
      >
      <div className="nav-wrapper">
        
        {/* Haut : logo + burger + avatar */}
        <div className="nav-header">
          <NavLink to="/dashboard">
            <img src={logoUrl || defaultLogo} alt="Logo" className="nav-logo" />
          </NavLink>
  
          <button className="burger-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
  
          <UserMenu darkMode={darkMode} toggleMode={toggleMode} />
        </div>
  
        {/* Liens de navigation */}
        <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
          <li><NavLink to="/dashboard" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Tableau de bord</NavLink></li>
          <li><NavLink to="/leads" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Clients</NavLink></li>
          <li><NavLink to="/Campagne" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Campagne</NavLink></li>
          <li><NavLink to="/Equipe" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Equipe</NavLink></li>
          <li><NavLink to="/calendar" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Calendrier</NavLink></li>
          <li><NavLink to="/materiel" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Parc Matériel</NavLink></li>
          <li><NavLink to="/factures" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Factures</NavLink></li>
          <li><NavLink to="/MyUserProfil" className="nav-link" onClick={handleLinkClick} style={{ color: navbarTextColor }}>Mon Profil</NavLink></li>
        </ul>

      </div>
    </nav>
  );
}

export default DashboardNavbar;