import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";

function ParametresInterface() {
  const [logoUrl, setLogoUrl] = useState("");
  const [navbarColor, setNavbarColor] = useState("#ED5F2D");
  const [navbarTextColor, setNavbarTextColor] = useState("#FFFFFF");

  useEffect(() => {
    const fetchParametres = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("parametres_interface")
        .select("logo_url, couleur_navbar, couleur_texte_navbar")
        .eq("utilisateur_id", user.id)
        .maybeSingle();

      if (data) {
        setLogoUrl(data.logo_url || "");
        setNavbarColor(data.couleur_navbar || "#ED5F2D");
        setNavbarTextColor(data.couleur_texte_navbar || "#FFFFFF");
      }
    };

    fetchParametres();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("parametres_interface")
      .upsert({
        utilisateur_id: user.id,
        logo_url: logoUrl,
        couleur_navbar: navbarColor,
        couleur_texte_navbar: navbarTextColor,
      }, { onConflict: ['utilisateur_id'] });

    if (error) alert("Erreur de sauvegarde : " + error.message);
    else alert("Paramètres enregistrés !");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Paramètres d'interface</h2>

      <label>Logo (URL) :</label>
      <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={{ width: "100%", marginBottom: "1rem" }} />

      <label>Couleur de la barre de navigation :</label>
      <input type="color" value={navbarColor} onChange={(e) => setNavbarColor(e.target.value)} style={{ marginBottom: "1rem" }} />

      <label>Couleur du texte de la navbar :</label>
      <input type="color" value={navbarTextColor} onChange={(e) => setNavbarTextColor(e.target.value)} style={{ marginBottom: "1rem" }} />

      <button onClick={handleSave} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
        Sauvegarder
      </button>
    </div>
  );
}

export default ParametresInterface;