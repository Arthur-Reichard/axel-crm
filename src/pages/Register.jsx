import React, { useState, useEffect } from "react";
import supabase from "../helper/supabaseClient";
import { Link } from "react-router-dom";
import "./css/Register.css";
import logo from "./Images/logoaxel.png"; // ajuste le chemin si besoin

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data) {
      setMessage("Compte créé ! Vérifie ton email.");
    }

    setEmail("");
    setPassword("");
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
          <div className={message.includes("!") ? "register-message" : "error-message"}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="register-form">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Email"
            required
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Mot de passe"
            required
          />
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