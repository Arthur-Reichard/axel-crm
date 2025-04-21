import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/FilterGroupManager.css";

export default function FilterGroupManager({ userId, entrepriseId, filtres, onLoadFiltres, mode, hasFilters }) {
  const [groupes, setGroupes] = useState([]);
  const [nomNouveauGroupe, setNomNouveauGroupe] = useState("");
  const [message, setMessage] = useState("");


  const fetchGroupes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const authId = user?.id;
  
    if (!authId) return;
  
    const { data: utilisateur } = await supabase
      .from("utilisateurs")
      .select("entreprise_id")
      .eq("id", authId)
      .single();
  
    if (!utilisateur) return;
  
    const entrepriseAuth = utilisateur.entreprise_id;
  
    const { data, error } = await supabase
      .from("groupes_filtres")
      .select("id, nom, filtres")
      .or(`cree_par.eq.${authId},entreprise_id.eq.${entrepriseAuth}`);
  
    if (!error) setGroupes(data);
  };
  

  const sauvegarderGroupe = async () => {
    if (!nomNouveauGroupe.trim()) return;
  
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      alert("Utilisateur non connecté");
      return;
    }
  
    const authId = user.id;
  
    const { data: utilisateur, error: utilisateurError } = await supabase
      .from("utilisateurs")
      .select("entreprise_id")
      .eq("id", authId)
      .single();
  
    if (utilisateurError || !utilisateur) {
      alert("Impossible de récupérer votre entreprise");
      return;
    }
  
    const entrepriseAuth = utilisateur.entreprise_id;
  
    const { error } = await supabase.from("groupes_filtres").insert({
      nom: nomNouveauGroupe.trim(),
      filtres,
      entreprise_id: entrepriseAuth,
      cree_par: authId
    });
  
    if (!error) {
      setNomNouveauGroupe("");
      alert("Groupe de filtres enregistré !");
      fetchGroupes();
    } else {
      alert("Erreur lors de la sauvegarde : " + error.message);
    }
  };  
  
  const appliquerGroupe = (groupe) => {
    onLoadFiltres(groupe.filtres);
    setMessage(`Filtre "${groupe.nom}" appliqué`);
    setTimeout(() => setMessage(""), 3000);
  };
  
  return (
    <div className="groupe-filtres-wrapper">
      {/* Affiche le select SEULEMENT si on a des groupes */}
      {groupes.length > 0 && (
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
      )}
  
      {/* Message de confirmation */}
      {message && <div className="groupe-message">{message}</div>}
  
      {/* Affiche sauvegarde SEULEMENT en mode edit ET si des filtres sont définis */}
      {mode === "edit" && filtres.length > 0 && (
        <div className="nouveau-groupe">
          <input
            className="new-g-input"
            placeholder="Nom du groupe"
            value={nomNouveauGroupe}
            onChange={(e) => setNomNouveauGroupe(e.target.value)}
          />
          <button className= "btn-save" onClick={sauvegarderGroupe}>Sauvegarder</button>
        </div>
      )}
    </div>
  );
   
}
