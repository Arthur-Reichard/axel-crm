import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "./Images/logoaxel.png";
import "./css/Navbar.css";

function Navbar({ darkMode, toggleMode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setMenuOpen(false); // referme le menu au clic sur un lien
  };

  return (
    <nav className={darkMode ? "top-navbar dark" : "top-navbar"}>
      <div className="left-nav">
        <Link to="/">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>

        {/* 🍔 Bouton burger mobile */}
        <button className="burger-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>

      {/* 📱 Menu déroulant mobile */}
      <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
        <li><Link to="#" className="nav-link" onClick={handleLinkClick}>Produits</Link></li>
        <li><Link to="#" className="nav-link" onClick={handleLinkClick}>Tarifs</Link></li>
        <li><Link to="#" className="nav-link" onClick={handleLinkClick}>Ressources</Link></li>
      </ul>

      <div className="right-nav">
        <span className="language-icon">🌐</span>
        <Link to="/login" className="nav-link">Connexion</Link>
        <Link to="/register" className="btn primary">Inscrivez-vous !</Link>
        <Link to="/demo" className="btn outline">Démo</Link>
        <button onClick={toggleMode} className="mode-button">
          {darkMode ? "Mode clair" : "Mode sombre"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;