import React from "react";
import { Link } from "react-router-dom";
import logo from "./Images/logoaxel.png";

function Navbar({ darkMode, toggleMode }) {
  return (
    <nav className={darkMode ? "top-navbar dark" : "top-navbar"}>
      <div className="left-nav">
        <Link to="/">
          <img src={logo} alt="Logo" className="nav-logo" />
        </Link>
        <ul className="nav-links">
          <li><Link to="#">Produits</Link></li>
          <li><Link to="#">Tarifs</Link></li>
          <li><Link to="#">Ressources</Link></li>
        </ul>
      </div>

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