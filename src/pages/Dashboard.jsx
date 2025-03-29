import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseClient";
import "../pages/css/dashboard.css";
import DashboardNavbar from "./DashboardNavbar";

function Dashboard({ darkMode, toggleMode }) {
  const navigate = useNavigate();

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
      if (!data.session) {
        navigate("/login");
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className={`dashboard ${darkMode ? "dark" : ""}`}>
      <DashboardNavbar darkMode={darkMode} toggleMode={toggleMode} />
      <main className="dashboard-main">
        <h1>Bienvenue sur Axel</h1>
        <p>
          Voici ton tableau de bord personnel. Suis tes leads, tes stats, et reste focus.
        </p>

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