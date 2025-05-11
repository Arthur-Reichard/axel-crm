import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { useSearchParams } from "react-router-dom";
import SMTPConnectionPopup from "./SMTPConnectionPopup";
import "./ConnectedEmailAccounts.css";

export default function ConnectedEmailAccounts({ utilisateurId: initialUtilisateurId }) {
  const [comptes, setComptes] = useState([]);
  const [popupSMTPVisible, setPopupSMTPVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const [utilisateurId, setUtilisateurId] = useState(initialUtilisateurId || null);

  useEffect(() => {
    const idFromUrl = searchParams.get("utilisateur_id");
    const success = searchParams.get("oauth");

    if (success === "success" && idFromUrl) {
      setUtilisateurId(idFromUrl);
      localStorage.setItem("connected_email_user_id", idFromUrl);

      // 🔄 Rafraîchir immédiatement les comptes après OAuth réussi
      fetchComptes(idFromUrl);
    }
  }, [searchParams]);

  const fetchComptes = async (userId) => {
    const { data, error } = await supabase
      .from("comptes_email")
      .select("id, email, fournisseur, etat_token")
      .eq("utilisateur_id", userId);

    if (!error) setComptes(data || []);
  };


  useEffect(() => {
    const fetchComptes = async () => {
      if (!utilisateurId) return;

      const { data, error } = await supabase
        .from("comptes_email")
        .select("id, email, fournisseur, etat_token")
        .eq("utilisateur_id", utilisateurId);

      if (!error) setComptes(data || []);
    };

    fetchComptes();
  }, [utilisateurId]);

  const handleDeconnexion = async (id) => {
    await supabase.from("comptes_email").delete().eq("id", id);
    setComptes(comptes.filter((compte) => compte.id !== id));
  };

  const isConnected = (fournisseur) =>
    comptes.some((compte) => compte.fournisseur === fournisseur);

  const handleGoogleLogin = () => {
    if (!utilisateurId) {
      alert("Utilisateur non identifié !");
      return;
    }

    const clientId = "423050071002-sji7iv52o72oqg9j385a9diajsf17m1v.apps.googleusercontent.com";
    const redirectUri = "http://localhost:8000/axel-crm/oauth/callback";
    const scope = encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email openid");
    const state = encodeURIComponent(utilisateurId);

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
    window.location.href = url;
  };

  const handleOutlookLogin = () => {
    const clientId = "74503484-21cf-49a4-af5f-7109fda52160";
    const redirectUri = "http://localhost:8000/oauth/callback/outlook";
    const scope = encodeURIComponent("Mail.Send User.Read openid profile email offline_access");

    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&prompt=consent`;
    window.location.href = url;
  };

  return (
    <div className="connected-emails">
      <h3>Comptes email connectés</h3>
      <div className="actions">
        <button
          className="btn-principal"
          disabled={isConnected("gmail")}
          onClick={handleGoogleLogin}
        >
          {isConnected("gmail") ? "Gmail connecté" : "Se connecter à Gmail"}
        </button>

        <button
          className="btn-principal"
          disabled={isConnected("outlook")}
          onClick={handleOutlookLogin}
        >
          {isConnected("outlook") ? "Outlook connecté" : "Se connecter à Outlook"}
        </button>

        <button className="btn-principal" onClick={() => setPopupSMTPVisible(true)}>
          Connecter SMTP
        </button>
      </div>

      {comptes.length > 0 && comptes.map((compte) => (
        <div key={compte.id} className="compte-item">
          <span className="fournisseur">{compte.fournisseur.toUpperCase()}</span>
          <span className="email">{compte.email}</span>
          <span className={`etat ${compte.etat_token}`}>{compte.etat_token}</span>
          <button className="btn-deco" onClick={() => handleDeconnexion(compte.id)}>Déconnecter</button>
        </div>
      ))}

      {popupSMTPVisible && (
        <SMTPConnectionPopup
          utilisateurId={utilisateurId}
          onClose={() => setPopupSMTPVisible(false)}
        />
      )}
    </div>
  );
}