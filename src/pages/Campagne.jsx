import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import CreateCampagnePopup from "../components/CreateCampagnePopup";
import "./css/Campagne.css";


export default function Campagne({ darkMode }) {
  const [campagnes, setCampagnes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const { data: utilisateur } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", user.id)
        .single();

      setEntrepriseId(utilisateur?.entreprise_id);

      const { data: campagnesData } = await supabase
        .from("campagnes")
        .select("*")
        .order("created_at", { ascending: false });

      setCampagnes(campagnesData || []);
    };

    fetchAll();
  }, []);

  return (
    <div className={`campagne-page ${darkMode ? "dark" : ""}`}>
      <div className="campagne-header">
        <h1 className="campagne-title">Campagne</h1>
      </div>

      <div className="campagne-grid">
        {campagnes.map((campagne) => (
          <div key={campagne.id} className="campagne-card">
            <h3>{campagne.nom}</h3>
            <p>{campagne.description}</p>
          </div>
        ))}

        <div className="campagne-card-add" onClick={() => setShowPopup(true)}>
          <span className="campagne-plus">+</span>
        </div>
      </div>

      {showPopup && (
        <CreateCampagnePopup
          userId={userId}
          entrepriseId={entrepriseId}
          onClose={() => setShowPopup(false)}
          onCreated={(nouvelle) => setCampagnes([nouvelle, ...campagnes])}
        />
      )}
    </div>
  );
}