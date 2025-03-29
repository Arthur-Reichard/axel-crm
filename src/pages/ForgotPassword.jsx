import React, { useState } from "react";
import supabase from "../helper/supabaseClient";
import "./css/Login.css"; // utilise les mêmes styles que Login
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Un lien de réinitialisation a été envoyé à ton email.");
    }
  };

  return (
    <div className="login-app dark">
      <div className="login-container">
        <h2>Mot de passe oublié</h2>
        <form onSubmit={handleSubmit} className="login-box">
          <label>
            Adresse email <span className="required">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <div className="register-message">{message}</div>}
          <button type="submit" className="login-button">
            Envoyer le lien
          </button>
        </form>
        <div className="login-footer">
          <Link to="/login">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;