import React from "react";
import { Link } from "react-router-dom";

function SectionHero() {
  return (
    <section className="hero-section reveal">
      <h1>La prospection a changé.</h1>
      <h2>Prêt à changer avec <span className="highlight">Axel</span> ?</h2>
      <p>Automatisez. Convertissez. Dominez votre marché sans effort humain superflu.</p>
      <div className="hero-buttons">
        <Link to="/signup" className="btn-primary">Essayer gratuitement</Link>
        <Link to="#revolution" className="btn-secondary">Voir comment</Link>
      </div>
    </section>
  );
}

export default SectionHero;
