import React from "react";
import { Link } from "react-router-dom";

function SectionCTAIntermediaire() {
  return (
    <section className="cta-intermediaire reveal">
      <h2>Êtes-vous prêt à arrêter de perdre du temps ?</h2>
      <Link to="/signup" className="btn-primary-big">Oui, je veux Axel 🔥</Link>
    </section>
  );
}

export default SectionCTAIntermediaire;
