// components/FilterGroupManager.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/FilterGroupManager.css";

export default function FilterGroupManager({ userId, entrepriseId, filtres, onLoadFiltres }) {
  const [groupes, setGroupes] = useState([]);
  const [nomNouveauGroupe, setNomNouveauGroupe] = useState("");
  const [message, setMessage] = useState("");

  const fetchGroupes = async () => {
    const { data, error } = await supabase
      .from("groupes_filtres")
      .select("id, nom, filtres")
      .or(`cree_par.eq.${userId},entreprise_id.eq.${entrepriseId}`);
    if (!error) setGroupes(data);
  };

  useEffect(() => {
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

  const supprimerGroupe = async (id) => {
    await supabase.from("groupes_filtres").delete().eq("id", id);
    fetchGroupes();
  };

  const appliquerGroupe = (groupe) => {
    onLoadFiltres(groupe.filtres);
    setMessage(`Filtre "${groupe.nom}" appliqué`);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="groupe-filtres-wrapper">
      <h4>Mes groupes de filtres</h4>

      <div className="nouveau-groupe">
        <input
          placeholder="Nom du groupe"
          value={nomNouveauGroupe}
          onChange={(e) => setNomNouveauGroupe(e.target.value)}
        />
        <button onClick={sauvegarderGroupe}>💾 Sauvegarder</button>
      </div>

      {message && <div className="groupe-message">{message}</div>}

      <select
        onChange={(e) => {
          const selected = groupes.find((g) => g.id === e.target.value);
          if (selected) appliquerGroupe(selected);
        }}
      >
        <option value="">-- Charger un groupe --</option>
        {groupes.map((groupe) => (
          <option key={groupe.id} value={groupe.id}>{groupe.nom}</option>
        ))}
      </select>

      <ul className="liste-groupes">
        {groupes.map((groupe) => (
          <li key={groupe.id}>
            <span>{groupe.nom}</span>
            <button onClick={() => appliquerGroupe(groupe)}>Appliquer</button>
            {groupe.filtres && groupe.filtres.length > 0 && (
              <button onClick={() => supprimerGroupe(groupe.id)}>🗑</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
