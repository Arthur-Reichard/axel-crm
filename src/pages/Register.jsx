import React, { useState, useEffect } from "react";
import { supabase } from '../helper/supabaseClient';
import { Link } from "react-router-dom";
import "./css/Register.css";
import logo from "./Images/logoaxel.png";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setMessage(signUpError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Utilisateur non authentifié, vérifie ton email.");
      return;
    }

    const userId = user.id;

    const { error: userInsertError } = await supabase.from("utilisateurs").insert([
      {
        id: userId,
        email: email,
      },
    ]);

    if (userInsertError) {
      setMessage("Erreur création profil : " + userInsertError.message);
      return;
    }

    setMessage("Compte créé avec succès !");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className={darkMode ? "register-app dark" : "register-app"}>
      <div className="logo-wrapper">
        <Link to="/">
          <img src={logo} alt="Logo Axel" className="register-logo" />
        </Link>
      </div>

      <div className="register-container">
        <h2>Créer un compte</h2>
        {message && (
          <div className={message.includes("succès") ? "register-message" : "error-message"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>
              <strong>Adresse email</strong> <span className="required">*</span>
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <strong>Mot de passe</strong> <span className="required">*</span>
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <strong>Confirmation du mot de passe</strong> <span className="required">*</span>
            </label>
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              type="password"
              required
            />
          </div>

          <button type="submit">Créer un compte</button>
        </form>

        <div className="register-footer">
          <span>Déjà un compte ?</span>
          <Link to="/login">Connexion</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;