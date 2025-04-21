import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import CreateCampagnePopup from "../components/CreateCampagnePopup";
import "./css/Campagne.css";


export default function Campagne({ darkMode }) {
  const [campagnes, setCampagnes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [campagneEnCours, setCampagneEnCours] = useState(null);

  const supprimerCampagne = async (id) => {
    const confirmation = window.confirm("Supprimer cette campagne ?");
    if (!confirmation) return;
  
    const { error } = await supabase.from("campagnes").delete().eq("id", id);
    if (!error) {
      setCampagnes(prev => prev.filter(c => c.id !== id));
    } else {
      console.error("Erreur suppression", error);
      alert("Erreur lors de la suppression");
    }
  };
  

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
        <div className="campagne-card-header">
          <h3 onClick={() => setCampagneEnCours(campagne)}>{campagne.nom}</h3>
          <button className="btn-delete-campagne" onClick={() => supprimerCampagne(campagne.id)}>supprimer</button>
        </div>
        <p>{campagne.description}</p>
      </div>

        ))}

        <div className="campagne-card-add" onClick={() => setShowPopup(true)}>
          <span className="campagne-plus">+</span>
        </div>
        </div>
      {(showPopup || campagneEnCours) && (
        <CreateCampagnePopup
          userId={userId}
          entrepriseId={entrepriseId}
          campagneInitiale={campagneEnCours} // NEW
          onClose={() => {
            setShowPopup(false);
            setCampagneEnCours(null);
          }}
          onCreated={(nouvelleOuModifiee) => {
            setCampagnes(prev => {
              const autres = prev.filter(c => c.id !== nouvelleOuModifiee.id);
              return [nouvelleOuModifiee, ...autres];
            });
          }}
        />
      )}
    </div>
  );
}