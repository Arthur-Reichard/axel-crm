import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../helper/supabaseClient';
import "../pages/css/MyUserProfil.css";
import DashboardNavbar from "./DashboardNavbar";

function MonProfil({ darkMode, toggleMode }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    birthdate: "",
    phone: "",
    email: "",
  });

  const [editMode, setEditMode] = useState({
    prenom: false,
    nom: false,
    birthdate: false,
    phone: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        navigate("/login");
        return;
      }

      setUserId(user.id);

      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!userError && userData) {
        setFormData({
          prenom: userData.prenom || "",
          nom: userData.nom || "",
          birthdate: userData.birthdate || "",
          phone: userData.phone || "",
          email: user.email || "", // email pris depuis auth
        });
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEdit = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from("utilisateurs")
      .upsert({ id: userId, ...formData });

    if (error) {
      console.error("Erreur Supabase :", error.message);
      alert("Erreur lors de la sauvegarde : " + error.message);
    } else {
      alert("Profil mis à jour !");
      setEditMode({ prenom: false, nom: false, birthdate: false, phone: false });
    }
  };

  const renderField = (label, name, type = "text") => (
    <div className="profil-field">
      <label>{label}</label>
      {formData[name] && !editMode[name] ? (
        <div className="readonly-line">
          <span>{formData[name]}</span>
          <button type="button" onClick={() => toggleEdit(name)}>Modifier</button>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
        />
      )}
    </div>
  );

  return (
    <div className={`mon-profil-app ${darkMode ? "dark" : ""}`}>
      <DashboardNavbar darkMode={darkMode} toggleMode={toggleMode} />
      <div className="mon-profil-container">
        <h1>Mon Profil</h1>
        <form onSubmit={handleSubmit}>
          {renderField("Prénom", "prenom")}
          {renderField("Nom", "nom")}
          {renderField("Date de naissance", "birthdate", "date")}
          {renderField("Téléphone", "phone")}

          <div className="profil-field">
            <label>Email :</label>
            <input name="email" value={formData.email} readOnly />
          </div>

          <button type="submit">Enregistrer</button>
        </form>
      </div>
    </div>
  );
}

export default MonProfil;