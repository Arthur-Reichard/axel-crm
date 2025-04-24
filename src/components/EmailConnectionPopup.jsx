import React, { useState } from "react";
import SMTPConnectionPopup from "./SMTPConnectionPopup";
import "./css/EmailConnectionPopup.css";

export default function EmailConnectionPopup({ utilisateurId, onClose }) {
  const [showSmtpPopup, setShowSmtpPopup] = useState(false);

  const clientIdGoogle = "423050071002-sji7iv52o72oqg9j385a9diajsf17m1v.apps.googleusercontent.com";
  const redirectUri = "http://localhost:8888/axel-crm/oauth/callback";

  const scopesGoogle = encodeURIComponent("https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email");

  const handleGoogleConnect = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientIdGoogle}&redirect_uri=${redirectUri}&scope=${scopesGoogle}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const outlookClientId = "74503484-21cf-49a4-af5f-7109fda52160";
  const outlookRedirectUri = "http://localhost:8888/oauth/callback/outlook";

  const handleOutlookLogin = () => {
    const scopes = encodeURIComponent("Mail.Send User.Read");
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${outlookClientId}&response_type=code&redirect_uri=${outlookRedirectUri}&response_mode=query&scope=${scopes}`;
    window.location.href = url;
  };

  return (
    <>
      <div className="popup">
        <div className="popup-content">
          <h2>Connexion à un fournisseur d'e-mail</h2>

          <div className="connect-section">
            <h4>Google</h4>
            <button onClick={handleGoogleConnect} className="btn-principal">
              Se connecter à Gmail
            </button>
          </div>

          <div className="connect-section">
            <h4>Microsoft / Outlook</h4>
            <button className="btn-principal" onClick={handleOutlookLogin}>
              Se connecter à Outlook
            </button>
          </div>

          <div className="connect-section">
            <h4>SMTP personnalisé</h4>
            <button className="btn-principal" onClick={() => setShowSmtpPopup(true)}>
              Connecter SMTP
            </button>
          </div>

          <div className="footer">
            <button onClick={onClose} className="btn-secondaire">Fermer</button>
          </div>
        </div>
      </div>

      {showSmtpPopup && (
        <SMTPConnectionPopup
          utilisateurId={utilisateurId}
          onClose={() => setShowSmtpPopup(false)}
        />
      )}
    </>
  );
}