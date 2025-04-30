import React from "react";

function SectionPourquoi() {
  const items = [
    { before: "CRM froid", after: "Interface vivante et orientée action" },
    { before: "Prospection old school", after: "Prospection intelligente et ciblée" },
    { before: "Heures perdues à chercher", after: "Leads générés automatiquement" },
    { before: "Outils dispersés", after: "Solution tout-en-un parfaitement intégrée" },
    { before: "Relances manuelles inefficaces", after: "Relances automatisées, intelligentes" },
    { before: "Suivi rigide et daté", after: "Vue claire, souple et évolutive" },
    { before: "Démotivation commerciale", after: "Simplicité = focus & performance" }
  ];

  // On double les cartes pour faire une boucle infinie visuellement
  const loopedItems = [...items, ...items];

  return (
    <section className="pourquoi-section reveal" id="revolution">
      <h3>Pourquoi <span className="highlight">Axel</span> est différent ?</h3>
      <div className="carousel-wrapper">
        <div className="carousel-loop">
          {loopedItems.map((item, index) => (
            <div key={index} className="carousel-card spherical">
              <p className="before">{item.before}</p>
              <p className="after">{item.after}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SectionPourquoi;
