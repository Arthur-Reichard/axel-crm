import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseClient";
import "./css/Login.css";
import Navbar from "./Navbar";

function Login() {
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Lire le thème au premier rendu
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  // Mettre à jour localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleMode = () => {
    setDarkMode(!darkMode);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setEmail("");
      setPassword("");
      return;
    }

    if (data) {
      navigate("/dashboard");
    }
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>
      <Navbar darkMode={darkMode} toggleMode={toggleMode} />
      <div className="login-page">
        <main className="main-content">
          <h2>Connexion</h2>
          {message && <span className="error-message">{message}</span>}
          <form onSubmit={handleSubmit} className="login-form">
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
            <button type="submit">Se connecter</button>
          </form>

          <div className="register-redirect">
            <span>Pas encore de compte ?</span>
            <Link to="/register">Créer un compte</Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;