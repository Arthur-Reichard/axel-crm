import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import "../pages/css/MyUserProfil.css";
import DashboardNavbar from "./DashboardNavbar";

function MonProfil({ darkMode, toggleMode }) {
  const [navbarTextColor, setNavbarTextColor] = useState("#FFFFFF");
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
    avatar_url: "",
    banner_url: ""
  });
  const [editMode, setEditMode] = useState({ prenom: false, nom: false, birthdate: false, phone: false });
  const [newCode, setNewCode] = useState(null);

  // === Nouveau ===
  const [navbarColor, setNavbarColor] = useState("#ED5F2D");
  const [logoUrl, setLogoUrl] = useState(null);

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
          avatar_url: userData.avatar_url || "",
          banner_url: userData.banner_url || ""
        });
        setEntrepriseId(userData.entreprise_id);
        setIsAdmin(userData.role === "admin");
        setEntreprise(userData.entreprises);
        if (userData.entreprise_id) fetchUsers(userData.entreprise_id);
        fetchParametres(user.id);
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

const fetchParametres = async (id) => {
  const { data, error } = await supabase
    .from("parametres_interface")
    .select("*")
    .eq("utilisateur_id", id)
    .maybeSingle();

  if (error) {
    console.error("Erreur récupération paramètres :", error.message);
    return;
  }

  if (data) {
    setNavbarColor(data.couleur_navbar || "#ED5F2D");
    setLogoUrl(data.logo_url || null);
    setNavbarTextColor(data.couleur_texte_navbar || "#FFFFFF");
  }
  else {
    // Aucune ligne trouvée : on en crée une par défaut
    const { error: insertError } = await supabase
      .from("parametres_interface")
      .upsert(
        {
          utilisateur_id: id,
          couleur_navbar: "#ED5F2D",
          logo_url: null,
        },
        { onConflict: ["utilisateur_id"] }
      );

    if (insertError) {
      console.error("Erreur création paramètres par défaut :", insertError.message);
    }
  }
};


  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const toggleEdit = (field) => setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));

const handleSubmit = async (e) => {
  e.preventDefault();

  const { error } = await supabase
    .from("utilisateurs")
    .upsert({ id: userId, ...formData });

  if (error) alert("Erreur : " + error.message);
  else alert("Profil mis à jour");

  await supabase.from("parametres_interface").upsert(
    {
      utilisateur_id: userId, // ✅ ici
      couleur_navbar: navbarColor,
      logo_url: logoUrl,
      couleur_texte_navbar: navbarTextColor
    },
    {
      onConflict: "utilisateur_id",
      ignoreDuplicates: false,
    }
  );
};

  const handleBannerUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ext = file.name.split('.').pop();
  const path = `${userId}/banner.${ext}`;

  // Supprime le fichier existant avant upload (si besoin)
  await supabase.storage.from("banners").remove([path]);

  // Puis upload proprement
  const { error: uploadError } = await supabase.storage.from("banners").upload(path, file, {
    contentType: file.type,
  });

  if (uploadError) return alert("Erreur upload bannière : " + uploadError.message);

  const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  await supabase.from("utilisateurs").update({ banner_url: publicUrl }).eq("id", userId);
  setFormData(prev => ({ ...prev, banner_url: `${publicUrl}?t=${Date.now()}` }));
};


  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `${userId}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, {
      upsert: true,
    });

    if (uploadError) return alert("Erreur upload : " + uploadError.message);

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    setLogoUrl(`${publicUrl}?t=${Date.now()}`); // Cache buster
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
    fetchUsers(entrepriseId);
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

  const renderField = (label, name, type = "text") => (
    <div className="profil-field">
        <label>Bannière de profil :</label>
  {formData.banner_url && (
    <img
      src={formData.banner_url}
      alt="Bannière"
      style={{ width: "100%", maxHeight: "150px", objectFit: "cover", marginBottom: "10px" }}
    />
  )}
  <input type="file" accept="image/*" onChange={handleBannerUpload} />
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
    <div className="myuserprofil-page">
      <DashboardNavbar />
      <div className={`mon-profil-app ${darkMode ? "dark" : ""}`}>
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
                }}>?</div>
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

            {/* 🎨 Choix de couleur de navbar */}
            <div className="profil-field">
              <label>Couleur de la Navbar :</label>
              <input type="color" value={navbarColor} onChange={(e) => setNavbarColor(e.target.value)} />
            </div>

            {/* 🖼️ Upload logo */}
            <div className="profil-field">
              <label>Logo personnalisé :</label>
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ height: "40px", marginBottom: "10px" }} />}
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>
            <div className="profil-field">
              <label>Couleur du texte de la Navbar :</label>
              <input type="color" value={navbarTextColor} onChange={(e) => setNavbarTextColor(e.target.value)} />
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
    </div>
  );
}

export default MonProfil;
