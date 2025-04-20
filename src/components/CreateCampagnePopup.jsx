import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import LiveLeadPreview from "./LiveLeadPreview";
import ShareWithMembers from "./ShareWithMembers";
import FiltreManager from "./FiltreManager";
import "./css/CreateCampagnePopup.css";
import FilterGroupManager from "./FilterGroupManager";

export default function CreateCampagnePopup({ userId, entrepriseId, onClose, onCreated }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [filtres, setFiltres] = useState([]);
  const [champs, setChamps] = useState([]);
  const [valeursPossibles, setValeursPossibles] = useState({});
  const [locked, setLocked] = useState(false);
  const [previewFiltres, setPreviewFiltres] = useState([]);
  const [utilisateursPartages, setUtilisateursPartages] = useState([]);
  const [groupesFiltres, setGroupesFiltres] = useState([]);

  useEffect(() => {
    const fetchChampsLeads = async () => {
      const { data, error } = await supabase.rpc("get_leads_columns");

      if (!error && data) {
        const champsUtiles = data
          .filter(col => ["text", "character varying", "ARRAY", "jsonb"].includes(col.data_type))
          .map(col => ({
            champ: col.column_name,
            label: col.column_name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
          }))
          .filter(c => !["id", "user_id", "entreprise_id"].includes(c.champ));

        setChamps(champsUtiles);

        for (const { champ } of champsUtiles) {
          const { data: valeurs } = await supabase
            .from("leads")
            .select(champ)
            .eq("entreprise_id", entrepriseId);

          const uniques = [...new Set(valeurs.flatMap(d => {
            const val = d[champ];
            if (Array.isArray(val)) return val;
            if (typeof val === "string") return [val];
            return [];
          }).filter(Boolean))];

          setValeursPossibles(prev => ({ ...prev, [champ]: uniques }));
        }
      }
    };

    fetchChampsLeads();
  }, [entrepriseId]);

  useEffect(() => {
    const fetchGroupesFiltres = async () => {
      const { data, error } = await supabase
        .from("groupes_filtres")
        .select("id, nom, filtres")
        .eq("entreprise_id", entrepriseId)
        .eq("cree_par", userId);
      if (!error) setGroupesFiltres(data);
    };
    fetchGroupesFiltres();
  }, [entrepriseId, userId]);

  const enregistrerGroupe = async () => {
    const nomGroupe = prompt("Nom du groupe de filtres :");
    if (!nomGroupe) return;
    await supabase.from("groupes_filtres").insert({
      nom: nomGroupe,
      filtres,
      entreprise_id: entrepriseId,
      cree_par: userId
    });
  };

  const appliquerGroupe = (id) => {
    const groupe = groupesFiltres.find(g => g.id === id);
    if (groupe) {
      setFiltres(groupe.filtres);
      setLocked(true);
      setPreviewFiltres(groupe.filtres);
    }
  };

  const creerCampagne = async () => {
    const { data, error } = await supabase.from("campagnes").insert([
      {
        nom,
        description,
        filtres,
        cree_par: userId,
        entreprise_id: entrepriseId
      }
    ]).select().single();

    if (!error && data?.id) {
      await Promise.all(
        utilisateursPartages.map(uid =>
          supabase.from("campagnes_utilisateurs").insert({
            campagne_id: data.id,
            utilisateur_id: uid
          })
        )
      );
      onCreated(data);
      onClose();
    } else {
      console.error("Erreur création campagne", error);
    }
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Nouvelle campagne</h2>
        <input
          className="champ-texte"
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Nom de la campagne"
        />
        <textarea
          className="champ-texte"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
        />

        <ShareWithMembers
          entrepriseId={entrepriseId}
          userId={userId}
          onSelect={setUtilisateursPartages}
        />

        <FilterGroupManager
          userId={userId}
          entrepriseId={entrepriseId}
          filtres={filtres}
          onLoadFiltres={(f) => setFiltres(f)}
        />

        <FiltreManager
          filtres={filtres}
          locked={locked}
          champs={champs}
          valeursPossibles={valeursPossibles}
          onAdd={() => setFiltres([...filtres, { champ: "", type: "contient", valeur: [] }])}
          onChange={(i, key, val) => {
            const updated = [...filtres];
            updated[i][key] = val;
            setFiltres(updated);
          }}
          onRemove={(i) => setFiltres(filtres.filter((_, idx) => idx !== i))}
          onValidate={() => {
            setLocked(true);
            setPreviewFiltres(filtres);
          }}
          onEdit={() => setLocked(false)}
        />

        {!locked && filtres.length > 0 && (
          <button onClick={enregistrerGroupe}>💾 Enregistrer ce groupe de filtres</button>
        )}

        <LiveLeadPreview filtres={previewFiltres.length > 0 ? previewFiltres : filtres} entrepriseId={entrepriseId} />

        <div className="footer">
          <button onClick={creerCampagne}>Créer</button>
          <button onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
