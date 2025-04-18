import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";

export default function LiveLeadPreview({ entrepriseId, filtres }) {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      let query = supabase.from("leads").select("*").eq("entreprise_id", entrepriseId);

      filtres.forEach(filtre => {
        const { champ, type, valeur } = filtre;
        if (valeur && champ) {
          if (type === "contient") {
            query = query.ilike(champ, `%${valeur}%`);
          } else if (type === "ne_contient_pas") {
            query = query.not("ilike", champ, `%${valeur}%`);
          } else if (type === "egal") {
            query = query.eq(champ, valeur);
          }
        }
      });

      const { data, error } = await query;
      if (!error) {
        setLeads(data);
      } else {
        console.error("Erreur récupération leads :", error);
        setLeads([]);
      }
    };

    fetchLeads();
  }, [entrepriseId, filtres]);

  return (
    <div className="lead-preview">
      <h5>{leads?.length || 0} leads trouvés :</h5>
      <ul>
        {leads?.map((lead) => (
          <li key={lead.id}>
            <strong>{lead.prenom} {lead.nom}</strong> — {lead.email_professionnel || "Aucun email"}
          </li>
        ))}
      </ul>
    </div>
  );
}
