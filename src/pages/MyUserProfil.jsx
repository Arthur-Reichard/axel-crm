import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import "../pages/css/MyUserProfil.css";
import DashboardNavbar from "./DashboardNavbar";

function MonProfil({ darkMode, toggleMode }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [entreprise, setEntreprise] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    birthdate: "",
    phone: "",
    email: "",
    avatar_url: ""
  });
  const [editMode, setEditMode] = useState({ prenom: false, nom: false, birthdate: false, phone: false });
  const [newCode, setNewCode] = useState(null);

  useEffect(() => {
    console.log("Utilisateurs dans la même entreprise :", users);
  }, [users]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!user || error) return navigate("/login");
      setUserId(user.id);

      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("*, entreprises(*)")
        .eq("id", user.id)
        .single();

      if (userData) {
        setFormData({
          prenom: userData.prenom || "",
          nom: userData.nom || "",
          birthdate: userData.birthdate || "",
          phone: userData.phone || "",
          email: user.email,
          avatar_url: userData.avatar_url || ""
        });
        setEntrepriseId(userData.entreprise_id);
        setIsAdmin(userData.role === "admin");
        setEntreprise(userData.entreprises);
        if (userData.entreprise_id) fetchUsers(userData.entreprise_id);
      }
    };
    fetchUserData();
  }, [navigate]);

  const fetchUsers = async (entId) => {
    const { data } = await supabase
      .from("utilisateurs")
      .select("id, prenom, nom, email, role, code_utilise")
      .eq("entreprise_id", entId);
    setUsers(data);
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleEdit = (field) => setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("utilisateurs").upsert({ id: userId, ...formData });
    if (error) alert("Erreur : " + error.message);
    else alert("Profil mis à jour");
  };

  const handleRoleChange = async (id, role) => {
    await supabase.from("utilisateurs").update({ role }).eq("id", id);
    fetchUsers(entrepriseId);
  };

  const handleDelete = async (id) => {
    if (id === userId) return alert("Tu ne peux pas te supprimer toi-même !");
    await supabase
      .from("utilisateurs")
      .update({
        entreprise_id: null,
        code_utilise: null
      })
      .eq("id", id);
    fetchUsers(entrepriseId);
  };
  

  const generateInviteCode = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expire = new Date();
    expire.setDate(expire.getDate() + 7);
    const { data, error } = await supabase
      .from("codes_invitation")
      .insert({ code, entreprise_id: entrepriseId, expire_le: expire.toISOString(), utilise: false })
      .select()
      .single();
    if (error) return alert("Erreur : " + error.message);
    setNewCode(data.code);
    fetchUsers(entrepriseId); // utile si tu veux rafraîchir après une action
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

    if (uploadError) return alert("Erreur upload : " + uploadError.message);

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;

    await supabase.from("utilisateurs").update({ avatar_url: publicUrl }).eq("id", userId);
    setFormData((prev) => ({
      ...prev,
      avatar_url: `${publicUrl}?t=${Date.now()}`,
    }));
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
        <input type={type} name={name} value={formData[name]} onChange={handleChange} />
      )}
    </div>
  );

  return (
    <div className={`mon-profil-app ${darkMode ? "dark" : ""}`}>
      <DashboardNavbar darkMode={darkMode} toggleMode={toggleMode} />

      <div className="mon-profil-container">
        <h1>Mon Profil</h1>
        <form onSubmit={handleSubmit}>
          <div className="profil-avatar">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-img" style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                color: "#fff"
              }}>
                ?
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
          </div>

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

        {entreprise && (
          <div className="entreprise-section">
            <h2>{entreprise.nom}</h2>
            <p><strong>Type :</strong> {entreprise.type}</p>

            {isAdmin && (
              <div>
                <button onClick={generateInviteCode}>Générer un code d'invitation</button>
                {newCode && <p>Code généré : <strong>{newCode}</strong></p>}
              </div>
            )}

            <h3>Équipe</h3>
            <table className="equipe-table">
              <thead>
                <tr><th>Prénom</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.prenom}</td>
                    <td>{u.nom}</td>
                    <td>{u.email}</td>
                    <td>
                      {isAdmin && u.id !== userId ? (
                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                          <option value="membre">Membre</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>
                      {isAdmin && u.id !== userId && (
                        <button onClick={() => handleDelete(u.id)}>Supprimer</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Membres ayant utilisé un code d’invitation</h3>
            <table className="equipe-table">
              <thead>
                <tr><th>Prénom</th><th>Nom</th><th>Email</th><th>Code</th><th>Rôle</th></tr>
              </thead>
              <tbody>
                {users.filter(u => u.code_utilise).map((u) => (
                  <tr key={u.id}>
                    <td>{u.prenom}</td>
                    <td>{u.nom}</td>
                    <td>{u.email}</td>
                    <td>{u.code_utilise}</td>
                    <td>{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonProfil;
