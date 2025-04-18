import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import LiveLeadPreview from "./LiveLeadPreview";
import "./css/CreateCampagnePopup.css";

export default function CreateCampagnePopup({ userId, entrepriseId, onClose, onCreated }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [filtres, setFiltres] = useState([]);
  const [champs, setChamps] = useState([]);
  const [valeursPossibles, setValeursPossibles] = useState({});
  const [locked, setLocked] = useState(false);
  const [previewFiltres, setPreviewFiltres] = useState([]);

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

      const uniques = [...new Set(data.map(d => d[champ]).flat().filter(Boolean))];
      setValeursPossibles(prev => ({ ...prev, [champ]: uniques }));
    });
  }, [entrepriseId]);

  const ajouterFiltre = () => setFiltres([...filtres, { champ: "", type: "contient", valeur: [] }]);

  const handleFiltreChange = (i, key, value) => {
    const updated = [...filtres];
    updated[i][key] = value;
    setFiltres(updated);
  };

  const ajouterTagValeur = (i, tag) => {
    const updated = [...filtres];
    if (!updated[i].valeur.includes(tag)) {
      updated[i].valeur.push(tag);
      setFiltres(updated);
    }
  };

  const supprimerTagValeur = (i, tag) => {
    if (locked) return;
    const updated = [...filtres];
    updated[i].valeur = updated[i].valeur.filter(val => val !== tag);
    setFiltres(updated);
  };

  const supprimerFiltre = (i) => setFiltres(filtres.filter((_, index) => index !== i));

  const validerFiltres = () => {
    setLocked(true);
    setPreviewFiltres(filtres);
  };

  const modifierFiltres = () => setLocked(false);

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

        <h4>Filtres</h4>
        {filtres.map((filtre, i) => (
          <div key={i} className="filtre-row">
            <select disabled={locked} value={filtre.champ} onChange={e => handleFiltreChange(i, "champ", e.target.value)}>
              <option value="">-- Champ --</option>
              {champs.map(c => (
                <option key={c.champ} value={c.champ}>{c.label}</option>
              ))}
            </select>

            <select disabled={locked} value={filtre.type} onChange={e => handleFiltreChange(i, "type", e.target.value)}>
              <option value="contient">contient</option>
              <option value="ne_contient_pas">ne contient pas</option>
              <option value="egal">égal</option>
            </select>

            <div className="tag-zone">
              {filtre.valeur.map((val, idx) => (
                <span className="tag" key={idx}>
                  {val}
                  {!locked && <button onClick={() => supprimerTagValeur(i, val)}>x</button>}
                </span>
              ))}
              {!locked && (
                <select onChange={e => ajouterTagValeur(i, e.target.value)}>
                  <option value="">Ajouter un tag...</option>
                  {(valeursPossibles[filtre.champ] || []).filter(v => !filtre.valeur.includes(v)).map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              )}
            </div>

            {!locked && <button onClick={() => supprimerFiltre(i)}>❌</button>}
          </div>
        ))}

        {!locked ? (
          <button className="btn-principal" onClick={validerFiltres}>✅ Valider les filtres</button>
        ) : (
          <button className="btn-secondaire" onClick={modifierFiltres}>✏️ Modifier les filtres</button>
        )}

        <hr />

        <LiveLeadPreview filtres={previewFiltres.length > 0 ? previewFiltres : filtres} entrepriseId={entrepriseId} />

        <div className="footer">
          <button onClick={creerCampagne}>Créer</button>
          <button onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}
