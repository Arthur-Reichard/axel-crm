import React from "react";

export default function LiveLeadPreview({ leads }) {
  return (
    <div className="live-leads-preview">
      {leads.length === 0 ? (
        <p>Aucun lead trouvé</p>
      ) : (
        <ul>
          {leads.map(lead => (
            <li key={lead.id}>
              {lead.prenom} {lead.nom} — {lead.email_professionnel}
            </li>
          ))}
        </ul>
      )}
    </div>
  );  
}
