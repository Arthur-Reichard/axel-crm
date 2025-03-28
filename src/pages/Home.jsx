import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./css/Home.css";
import Navbar from "./Navbar";

function Home() {
  const [darkMode, setDarkMode] = useState(false);

  // Lire le thème au premier rendu
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  // Mettre à jour localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Navbar darkMode={darkMode} toggleMode={toggleMode} />
      <div className="home">
        <main className="main-content">
          <h2>Bienvenue sur Axel</h2>
          <p>
            Découvrez nos produits et services. Connectez-vous ou créez un compte
            pour accéder à votre tableau de bord.
          </p>
        </main>
      </div>
    </div>
  );
}

export default Home;
