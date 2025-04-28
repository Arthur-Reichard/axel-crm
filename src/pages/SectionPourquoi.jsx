import React from "react";

function SectionPourquoi() {
  return (
    <section className="pourquoi-section reveal" id="revolution">
      <h3>Pourquoi <span className="highlight">Axel</span> est différent ?</h3>
      <div className="comparatifs">
        <div className="bloc">
          <p>❌ CRM froid</p>
          <p>✅ Axel : vivant et intelligent</p>
        </div>
        <div className="bloc">
          <p>❌ Prospection old school</p>
          <p>✅ Prospection intelligente</p>
        </div>
        <div className="bloc">
          <p>❌ Perte de temps</p>
          <p>✅ Focus maximal sur vos vrais prospects</p>
        </div>
        <div className="bloc">
          <p>❌ Stress commercial</p>
          <p>✅ Simplicité optimisée</p>
        </div>
      </div>
    </section>
  );
}

export default SectionPourquoi;
