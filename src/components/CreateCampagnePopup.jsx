import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import './css/CreateCampagnePopup.css';
import LiveLeadPreview from "./LiveLeadPreview";

export default function CreateCampagnePopup({ userId, entrepriseId, onClose, onCreated }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [filtres, setFiltres] = useState([]);
  const [champs, setChamps] = useState([]);
  const [valeursPossibles, setValeursPossibles] = useState({});
  const [leadsFiltres, setLeadsFiltres] = useState([]);

  useEffect(() => {
    const champsUtiles = [
      { champ: "adresse_entreprise_ville", label: "Ville" },
      { champ: "email_professionnel", label: "Email pro" },
      { champ: "statut_client", label: "Statut client" },
      { champ: "canal_prefere", label: "Canal préféré" },
      { champ: "origine_contact", label: "Origine contact" },
      { champ: "poste_contact", label: "Poste contact" },
      { champ: "nom_entreprise", label: "Nom entreprise" },
      { champ: "tags", label: "Tags" }
    ];
    setChamps(champsUtiles);

    champsUtiles.forEach(async ({ champ }) => {
      const { data } = await supabase
        .from("leads")
        .select(champ)
        .eq("entreprise_id", entrepriseId);

      const uniques = [...new Set(data.map(d => d[champ]).filter(Boolean))];
      setValeursPossibles(prev => ({ ...prev, [champ]: uniques }));
    });
  }, [entrepriseId]);

  // 🔥 Filtrage des leads en direct
  useEffect(() => {
    const filtrerLeads = async () => {
      let query = supabase.from("leads").select("*").eq("entreprise_id", entrepriseId);

      filtres.forEach(({ champ, type, valeur }) => {
        if (!champ || !valeur) return;

        if (type === "contient") {
          query = query.ilike(champ, `%${valeur}%`);
        } else if (type === "ne_contient_pas") {
          query = query.not.ilike(champ, `%${valeur}%`);
        } else if (type === "egal") {
          query = query.eq(champ, valeur);
        }
      });

      const { data, error } = await query;
      if (!error) setLeadsFiltres(data);
    };

    filtrerLeads();
  }, [filtres, entrepriseId]); // 🔥

  const ajouterFiltre = () => setFiltres([...filtres, { champ: "", type: "contient", valeur: "" }]);

  const handleFiltreChange = (i, key, value) => {
    const updated = [...filtres];
    updated[i][key] = value;
    setFiltres(updated);
  };

  const supprimerFiltre = (i) => setFiltres(filtres.filter((_, index) => index !== i));

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

    if (!error) {
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
        <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la campagne" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />

        <h4>Filtres</h4>
        {filtres.map((filtre, i) => (
          <div key={i} className="filtre-row">
            <select value={filtre.champ} onChange={e => handleFiltreChange(i, "champ", e.target.value)}>
              <option value="">-- Champ --</option>
              {champs.map(c => (
                <option key={c.champ} value={c.champ}>{c.label}</option>
              ))}
            </select>

            <select value={filtre.type} onChange={e => handleFiltreChange(i, "type", e.target.value)}>
              <option value="contient">contient</option>
              <option value="ne_contient_pas">ne contient pas</option>
              <option value="egal">égal</option>
            </select>

            {valeursPossibles[filtre.champ] && valeursPossibles[filtre.champ].length > 0 ? (
              <select value={filtre.valeur} onChange={e => handleFiltreChange(i, "valeur", e.target.value)}>
                <option value="">-- Valeur --</option>
                {valeursPossibles[filtre.champ].map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            ) : (
              <input value={filtre.valeur} onChange={e => handleFiltreChange(i, "valeur", e.target.value)} placeholder="Valeur" />
            )}

            <button type="button" onClick={() => supprimerFiltre(i)}>❌</button>
          </div>
        ))}

        <button type="button" onClick={ajouterFiltre}>+ Ajouter un filtre</button>

        <h4>Résultats :</h4>
        <LiveLeadPreview leads={leadsFiltres} />

        <hr />
        <button onClick={creerCampagne}>Créer</button>
        <button onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}