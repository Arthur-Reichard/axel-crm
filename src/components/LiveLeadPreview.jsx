import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/LiveLeadPreview.css";
import { applyFiltersToQuery } from "./utils/applyFiltersToQuery";

export default function LiveLeadPreview({ filtres, entrepriseId }) {
  const [leads, setLeads] = useState([]);
  const [afficherListe, setAfficherListe] = useState(false);

  let query = supabase.from("leads").select("*").eq("entreprise_id", entrepriseId);
  query = applyFiltersToQuery(query, filtres);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        let query = supabase.from("leads").select("*").eq("entreprise_id", entrepriseId);
        query = applyFiltersToQuery(query, filtres);
  
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