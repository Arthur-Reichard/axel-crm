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
    
        const allOrConditions = [];
    
        for (const filtre of filtres) {
          if (!filtre.champ || !filtre.type || !filtre.valeur || filtre.valeur.length === 0) continue;
    
          const conditions = filtre.valeur.map(val => {
            const champ = filtre.champ;
            const value = val;
    
            if (filtre.type === "contient") {
              return `${champ}.ilike.%${value}%`;
            } else if (filtre.type === "ne_contient_pas") {
              // On gère les "NOT" plus bas
              return `not.${champ}.ilike.%${value}%`;
            } else if (filtre.type === "egal") {
              return `${champ}.eq.${value}`;
            }
            return "";
          }).filter(Boolean);
    
          // Ajoute les conditions de ce filtre
          if (conditions.length > 0) {
            if (filtre.type === "ne_contient_pas") {
              // les NOT doivent être appliqués avec AND (pas dans un OR global)
              for (const condition of conditions) {
                query = query.not(condition);
              }
            } else {
              allOrConditions.push(...conditions);
            }
          }
        }
    
        if (allOrConditions.length > 0) {
          query = query.or(allOrConditions.join(","));
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