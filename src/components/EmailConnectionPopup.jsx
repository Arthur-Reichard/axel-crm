import React, { useEffect, useState } from "react";
import SMTPConnectionPopup from "./SMTPConnectionPopup";
import "./css/EmailConnectionPopup.css";
import { supabase } from "../helper/supabaseClient";

export default function EmailConnectionPopup({ utilisateurId, onClose }) {
  const [showSmtpPopup, setShowSmtpPopup] = useState(false);
  const [comptes, setComptes] = useState([]);

  const clientIdGoogle = "423050071002-sji7iv52o72oqg9j385a9diajsf17m1v.apps.googleusercontent.com";
  const redirectUri = "http://localhost:8000/axel-crm/oauth/callback";
  const scopesGoogle = encodeURIComponent(
    "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"
  );

  const outlookClientId = "74503484-21cf-49a4-af5f-7109fda52160";
  const outlookRedirectUri = "http://localhost:8000/oauth/callback/outlook";

  useEffect(() => {
    fetchComptesConnectes();
  }, []);

  const fetchComptesConnectes = async () => {
    const { data } = await supabase
      .from("comptes_email")
      .select("id, fournisseur, email")
      .eq("utilisateur_id", utilisateurId);

    setComptes(data || []);
  };

  const handleGoogleConnect = () => {
    const state = encodeURIComponent(utilisateurId);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientIdGoogle}&redirect_uri=${redirectUri}&scope=${scopesGoogle}&access_type=offline&prompt=consent&state=${state}`;
    window.location.href = authUrl;
  };

  const handleOutlookLogin = () => {
    const scopes = encodeURIComponent("Mail.Send User.Read");
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${outlookClientId}&response_type=code&redirect_uri=${outlookRedirectUri}&response_mode=query&scope=${scopes}`;
    window.location.href = url;
  };

  const handleDeconnexion = async (fournisseur) => {
    if (fournisseur === "gmail") {
      const response = await fetch("http://localhost:8000/axel-crm/deconnecter-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utilisateur_id: utilisateurId }),
      });

      const result = await response.json();
      if (result.status !== "ok") {
        alert("Erreur lors de la déconnexion : " + result.detail);
        return;
      }
    } else {
      // Outlook/SMTP
      await supabase
        .from("comptes_email")
        .delete()
        .eq("utilisateur_id", utilisateurId)
        .eq("fournisseur", fournisseur);
    }

    fetchComptesConnectes();
  };


  const isConnected = (fournisseur) =>
    comptes.some((compte) => compte.fournisseur === fournisseur);

  return (
    <>
      <div className="popup">
        <div className="popup-content">
          <h2>Connexion à un fournisseur d'e-mail</h2>

          <div className="connect-section">
            <h4>Google</h4>
            <button
              onClick={() =>
                isConnected("gmail")
                  ? handleDeconnexion("gmail")
                  : handleGoogleConnect()
              }
              className={`btn-principal ${
                isConnected("gmail") ? "btn-deconnexion" : ""
              }`}
            >
              {isConnected("gmail") ? "Déconnecter Gmail" : "Se connecter à Gmail"}
            </button>
          </div>

          <div className="connect-section">
            <h4>Microsoft / Outlook</h4>
            <button
              className={`btn-principal ${
                isConnected("outlook") ? "btn-deconnexion" : ""
              }`}
              onClick={() =>
                isConnected("outlook")
                  ? handleDeconnexion("outlook")
                  : handleOutlookLogin()
              }
            >
              {isConnected("outlook") ? "Déconnecter Outlook" : "Se connecter à Outlook"}
            </button>
          </div>

          <div className="connect-section">
            <h4>SMTP personnalisé</h4>
            <button
              className={`btn-principal ${
                isConnected("smtp") ? "btn-deconnexion" : ""
              }`}
              onClick={() =>
                isConnected("smtp")
                  ? handleDeconnexion("smtp")
                  : setShowSmtpPopup(true)
              }
            >
              {isConnected("smtp") ? "Déconnecter SMTP" : "Connecter SMTP"}
            </button>
          </div>

          <div className="footer">
            <button onClick={onClose} className="btn-secondaire">
              Fermer
            </button>
          </div>
        </div>
      </div>

      {showSmtpPopup && (
        <SMTPConnectionPopup
          utilisateurId={utilisateurId}
          onClose={() => {
            setShowSmtpPopup(false);
            fetchComptesConnectes(); // refresh après SMTP
          }}
        />
      )}
    </>
  );
}