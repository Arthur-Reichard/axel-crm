import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/SMTPConnectionPopup.css";

export default function SMTPConnectionPopup({ utilisateurId, onClose }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("http://localhost:8000/smtp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: utilisateurId,
        host,
        port,
        username,
        password,
      }),
    });

    const result = await response.json();
    if (result.status === "ok") {
      setStatus("✅ Compte SMTP connecté avec succès");
    } else {
      setStatus("❌ Erreur : " + result.detail);
    }

    setLoading(false);
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Connexion SMTP personnalisée</h2>

        <form onSubmit={handleSubmit}>
          <label>Hôte SMTP :</label>
          <input type="text" value={host} onChange={(e) => setHost(e.target.value)} required />

          <label>Port :</label>
          <input type="number" value={port} onChange={(e) => setPort(parseInt(e.target.value))} required />

          <label>Email (utilisé pour l'envoi) :</label>
          <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} required />

          <label>Mot de passe ou token SMTP :</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <p className="warning">⚠️ Assurez-vous d'utiliser un mot de passe d'application si vous êtes sur Gmail ou Outlook.</p>

          <div className="footer">
            <button type="button" onClick={onClose} className="btn-secondaire">Annuler</button>
            <button type="submit" className="btn-principal" disabled={loading}>
              {loading ? "Connexion..." : "Connecter SMTP"}
            </button>
          </div>

          {status && <p className="status-message">{status}</p>}
        </form>
      </div>
    </div>
  );
}