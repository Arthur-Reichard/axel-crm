import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../helper/supabaseClient';
import "../pages/css/dashboard.css";
import DashboardNavbar from "./DashboardNavbar";
import EntitySelector from "../components/EntitySelector";


function Dashboard({ darkMode, toggleMode }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [siren, setSiren] = useState("");
  const [rna, setRna] = useState("");
  const [userId, setUserId] = useState(null);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/login");
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err.message);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;
      if (!userId) return navigate("/login");
      setUserId(userId);

      const { data: userData, error } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", userId)
        .single();

      if (error || !userData?.entreprise_id) {
        setShowModal(true);
      }
    };
    checkSession();
  }, [navigate]);

  const handleEntityCreation = async () => {
    if (!entityName || !entityType) {
      alert("Merci de sélectionner un type d'entité et d'entrer un nom.");
      return;
    }

    let entrepriseData = { nom: entityName, type: entityType };
    if (entityType === "entreprise" && !/^[0-9]{9}$/.test(siren)) {
      alert("Le numéro SIREN doit contenir exactement 9 chiffres.");
      return;
    }
    if (entityType === "entreprise") entrepriseData.siren = siren;
    if (entityType === "association" && rna) entrepriseData.rna = rna;

    const { data: newEntreprise, error: entrepriseError } = await supabase
      .from("entreprises")
      .insert([entrepriseData])
      .select()
      .single();

    if (entrepriseError) {
      alert("Erreur lors de la création de l'entité : " + entrepriseError.message);
      return;
    }

    const { error: userUpdateError } = await supabase
      .from("utilisateurs")
      .update({ entreprise_id: newEntreprise.id })
      .eq("id", userId);

    if (userUpdateError) {
      alert("Erreur lors de l'association de l'utilisateur : " + userUpdateError.message);
    } else {
      setShowModal(false);
    }
  };

  return (
    <div className={`dashboard ${darkMode ? "dark" : ""}`}>
      {showModal && (
          <EntitySelector
          userId={userId}
          onEntityLinked={() => setShowModal(false)}
        />
      )}

      <main className={`dashboard-main ${showModal ? "blur" : ""}`}>
        <h1>Bienvenue sur votre CRM</h1>
        <p>Voici ton tableau de bord personnel. Suis tes leads, tes stats, et reste focus.</p>

        <div className="card-grid">
          <div className="card">
            <h2>Leads générés</h2>
            <p>124</p>
          </div>
          <div className="card">
            <h2>Conversions</h2>
            <p>27</p>
          </div>
          <div className="card">
            <h2>Taux de réponse</h2>
            <p>22%</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
