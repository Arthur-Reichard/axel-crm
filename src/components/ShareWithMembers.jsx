import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/CreateCampagnePopup.css";

export default function ShareWithMembers({ entrepriseId, userId, value = [], onSelect }) {
  const [membres, setMembres] = useState([]);
  const [selection, setSelection] = useState(value);
  const [recherche, setRecherche] = useState("");

  // Appliquer la sélection externe
  useEffect(() => {
    setSelection(value);
  }, [value]);

  // Charger les membres de l'entreprise sauf soi-même
  useEffect(() => {
    const fetchMembres = async () => {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select("id, email")
        .eq("entreprise_id", entrepriseId)
        .neq("id", userId);

      if (!error && data) setMembres(data);
    };

    fetchMembres();
  }, [entrepriseId, userId]);

  const ajouterMembre = (id) => {
    if (!selection.includes(id)) {
      const updated = [...selection, id];
      setSelection(updated);
      onSelect(updated);
      setRecherche("");
    }
  };

  const retirerMembre = (id) => {
    const updated = selection.filter(uid => uid !== id);
    setSelection(updated);
    onSelect(updated);
  };

  const membresFiltres = membres.filter(
    m =>
      !selection.includes(m.id) &&
      m.email.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="section">
      <h4>Partager avec des membres</h4>

      {/* Barre de recherche */}
      <div className="search-membre-container">
        <input
          type="text"
          className="input-texte"
          placeholder="Rechercher un membre par email..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        {recherche && membresFiltres.length > 0 && (
          <div className="membre-suggestion-list">
            {membresFiltres.map((m) => (
              <div
                key={m.id}
                className="membre-suggestion"
                onClick={() => ajouterMembre(m.id)}
              >
                {m.email}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membres sélectionnés */}
      <div className="tag-added">
        {selection.map((id) => {
          const membre = membres.find((m) => m.id === id);
          return (
            <div key={id} className="selected-membre">
              {membre?.email || id}
              <button onClick={() => retirerMembre(id)}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
 