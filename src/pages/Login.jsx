import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../helper/supabaseClient";
import "./css/Login.css";
import logo from "./Images/logoaxel.png";
import googleLogo from "./Images/Googleicon.svg";
import appleLogo from "./Images/appleicon.svg";


function Login() {
  const [darkMode, setDarkMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
    <div className={darkMode ? "login-app dark" : "login-app"}>
      <div className="logo-wrapper">
        <Link to="/">
          <img src={logo} alt="Logo Axel" className="login-logo" />
        </Link>
      </div>

      <div className="login-container">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit} className="login-box">
          <label>Adresse email <span className="required">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Mot de passe <span className="required">*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {message && <div className="error-message">{message}</div>}

          <button type="submit" className="login-button">Connexion</button>

          <div className="separator"><span>OU</span></div>

          <button type="button" className="social-button google">
            <img src={googleLogo} alt="Google" className="social-icon" />
            Se connecter avec Google
          </button>

          <button type="button" className="social-button apple">
            <img src={appleLogo} alt="Apple" className="social-icon" />
            Se connecter avec Apple
          </button>
        </form>

        <div className="login-footer">
          <Link to="/register">Créer un compte</Link>
          <Link to="/forgot-password">Mot de passe oublié</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;