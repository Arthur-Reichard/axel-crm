import React from "react";
import { Link } from "react-router-dom";

function SectionFinalCTA() {
  return (
    <section className="cta-final reveal">
      <h2>Transformez votre prospection dès aujourd'hui avec <span className="highlight">Axel</span>.</h2>
      <Link to="/signup" className="btn-primary">Rejoindre la révolution</Link>
    </section>
  );
}

export default SectionFinalCTA;
