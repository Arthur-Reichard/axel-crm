import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/LiveLeadPreview.css";

export default function LiveLeadPreview({ filtres, entrepriseId }) {
  const [leads, setLeads] = useState([]);
  const [afficherListe, setAfficherListe] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        let query = supabase.from("leads").select("*").eq("entreprise_id", entrepriseId);

        for (const filtre of filtres) {
          if (!filtre.champ || !filtre.type || !filtre.valeur || filtre.valeur.length === 0) continue;

          const orConditions = filtre.valeur.map(val => {
            let champ = filtre.champ;
            let value = val;

            if (filtre.type === "contient") {
              return `${champ}.ilike.%${value}%`;
            } else if (filtre.type === "ne_contient_pas") {
              return `not.${champ}.ilike.%${value}%`;
            } else if (filtre.type === "egal") {
              return `${champ}.eq.${value}`;
            }
            return "";
          }).filter(Boolean);

          if (orConditions.length > 0) {
            query = query.or(`(${orConditions.join(",")})`);
          }
        }

        const { data, error } = await query;
        if (error) {
          console.error("Erreur récupération leads :", error);
        } else {
          setLeads(data);
        }
      } catch (err) {
        console.error("Erreur:", err);
      }
    };

    fetchLeads();
  }, [filtres, entrepriseId]);

  return (
    <div className="preview-leads">
      <h4>
        Leads trouvés : {leads.length}
        {leads.length > 0 && (
          <button className="toggle-button" onClick={() => setAfficherListe(!afficherListe)}>
            {afficherListe ? "Masquer la liste" : "Voir la liste"}
          </button>
        )}
      </h4>

      {afficherListe && (
        <div className="leads-liste-scrollable">
          {leads.map(lead => (
            <div key={lead.id} className="lead-item">
              <strong>{lead.prenom} {lead.nom}</strong> – {lead.email_professionnel || "Aucun email"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}