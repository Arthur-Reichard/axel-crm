import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/FilterGroupManager.css";

export default function FilterGroupManager({ userId, entrepriseId, filtres, onLoadFiltres, mode, hasFilters }) {
  const [groupes, setGroupes] = useState([]);
  const [nomNouveauGroupe, setNomNouveauGroupe] = useState("");
  const [message, setMessage] = useState("");


  const fetchGroupes = async () => {
    if (!userId || !entrepriseId) return;
    const { data, error } = await supabase
      .from("groupes_filtres")
      .select("id, nom, filtres")
      .or(`cree_par.eq.${userId},entreprise_id.eq.${entrepriseId}`);
    if (!error) setGroupes(data);
  };
  

  useEffect(() => {
    if (!userId || !entrepriseId) return;
    fetchGroupes();
  }, [userId, entrepriseId]);
  

  const sauvegarderGroupe = async () => {
    if (!nomNouveauGroupe.trim()) return;

    const { error } = await supabase.from("groupes_filtres").insert({
      nom: nomNouveauGroupe.trim(),
      filtres,
      entreprise_id: entrepriseId,
      cree_par: userId
    });

    if (!error) {
      setNomNouveauGroupe("");
      setMessage("Groupe enregistré ✅");
      fetchGroupes();
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const appliquerGroupe = (groupe) => {
    onLoadFiltres(groupe.filtres);
    setMessage(`Filtre "${groupe.nom}" appliqué`);
    setTimeout(() => setMessage(""), 3000);
  };
  if (!hasFilters) return null;
  return (
    <div className="groupe-filtres-wrapper">
      {/* menu déroulant en haut */}
      <select
        onChange={(e) => {
          const selected = groupes.find((g) => g.id === e.target.value);
          if (selected) appliquerGroupe(selected);
        }}
      >
        <option value="">-- Charger un groupe de filtres --</option>
        {groupes.map((groupe) => (
          <option key={groupe.id} value={groupe.id}>{groupe.nom}</option>
        ))}
      </select>

      {/* message temporaire */}
      {message && <div className="groupe-message">{message}</div>}

      {/* bouton de sauvegarde déplacé en bas */}
      {mode === "edit" && (
        <div className="nouveau-groupe">
          <input
            placeholder="Nom du groupe"
            value={nomNouveauGroupe}
            onChange={(e) => setNomNouveauGroupe(e.target.value)}
          />
          <button onClick={sauvegarderGroupe}>Sauvegarder</button>
        </div>
      )}
    </div>
  );
}
