// components/ShareWithMembers.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/ShareWithMembers.css";

export default function ShareWithMembers({ entrepriseId, userId, onSelect }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const formatNom = (m) => (m.prenom || m.nom) ? `${m.prenom || ""} ${m.nom || ""}`.trim() : m.email;

  useEffect(() => {
    const fetchMembres = async () => {
      if (search.trim() === "") {
        setResults([]);
        return;
      }

      const { data, error } = await supabase
        .from("utilisateurs")
        .select("id, prenom, nom, email")
        .eq("entreprise_id", entrepriseId)
        .neq("id", userId);

      if (!error) {
        const lower = search.toLowerCase();
        const filtrés = data.filter(m =>
          `${m.prenom} ${m.nom} ${m.email}`.toLowerCase().includes(lower)
        );
        setResults(filtrés);
      }
    };

    fetchMembres();
  }, [search, entrepriseId, userId]);

  const ajouterMembre = (m) => {
    if (!selected.find(u => u.id === m.id)) {
      const updated = [...selected, m];
      setSelected(updated);
      onSelect(updated.map(x => x.id));
    }
    setSearch("");
    setResults([]);
  };

  const retirerMembre = (id) => {
    const updated = selected.filter(u => u.id !== id);
    setSelected(updated);
    onSelect(updated.map(x => x.id));
  };

  return (
    <div className="share-members-wrapper">
      <label htmlFor="member-search"></label>
      <input
        id="member-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Ajouter des personnes"
      />
      {results.length > 0 && (
        <ul className="results-list">
          {results.map(m => (
            <li key={m.id} onClick={() => ajouterMembre(m)}>
                {(m.prenom || m.nom) ? `${m.prenom || ""} ${m.nom || ""}`.trim() : m.email}
            </li>
          ))}
        </ul>
      )}
      <div className="selected-members">
        {selected.map(m => (
            <span className="member-tag" key={m.id}>
                {formatNom(m)}
                <button onClick={() => retirerMembre(m.id)}>✖</button>
            </span>

        ))}
      </div>
    </div>
  );
}
