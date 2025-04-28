import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./css/Home.css";
import Navbar from "./Navbar";
import { setupAnimations } from "./HomeAnimations";
import logo from "./Images/logoaxel.png";

import SectionHero from "./SectionHero";
import SectionPourquoi from "./SectionPourquoi";
import SectionFonctionnement from "./SectionFonctionnement";
import SectionCTAIntermediaire from "./SectionCTAIntermediaire";
import SectionVision from "./SectionVision";
import SectionFinalCTA from "./SectionFinalCTA";

function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false); // ➔ pour savoir si on a scrollé

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    setupAnimations();
  }, []);

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Navbar darkMode={darkMode} toggleMode={toggleMode} />
      <div className="home">
        {/* ➔ ici on utilise la classe selon scroll */}
        <img
          src={logo}
          alt="Logo Axel"
          className={scrolled ? "logo-floating logo-visible" : "logo-floating"}
        />
        <main className="main-content">
          <SectionHero />
          <SectionPourquoi />
          <SectionFonctionnement />
          <SectionCTAIntermediaire />
          <SectionVision />
          <SectionFinalCTA />
        </main>
      </div>
    </div>
  );
}

export default Home;
