import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import CreateCampagnePopup from "../components/CreateCampagnePopup";
import "./css/Campagne.css";
import EmailSenderPopup from "../components/EmailSenderPopup";


export default function Campagne({ darkMode }) {
  const [campagnes, setCampagnes] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [userId, setUserId] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [campagneEnCours, setCampagneEnCours] = useState(null);
  const [campagneEmailing, setCampagneEmailing] = useState(null);

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
        <div key={campagne.id} className="campagne-card" onClick={() => setCampagneEnCours(campagne)}>
          <h3>{campagne.nom}</h3>
          <p>{campagne.description}</p>
          <button
            className="btn-email"
            onClick={(e) => {
              e.stopPropagation(); // évite d’ouvrir la popup d'édition
              setCampagneEmailing(campagne);
            }}
          >
            📧 Emailing
          </button>
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
            if (nouvelleOuModifiee.deleted) {
              setCampagnes(prev => prev.filter(c => c.id !== nouvelleOuModifiee.id));
            } else {
              setCampagnes(prev => {
                const autres = prev.filter(c => c.id !== nouvelleOuModifiee.id);
                return [nouvelleOuModifiee, ...autres];
              });
            }
          }}          
        />
      )}
      {campagneEmailing && (
        <EmailSenderPopup
          campagne={campagneEmailing}
          onClose={() => setCampagneEmailing(null)}
          userId={userId}
          entrepriseId={entrepriseId}
        />
      )}
    </div>
  );
}