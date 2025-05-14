// src/pages/RedirectRoot.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";

export default function RedirectRoot() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const isLoggedIn = !!data.session;
      navigate(isLoggedIn ? "/dashboard" : "/home", { replace: true });
    };
    checkSession();
  }, [navigate]);

  // Optionnel : un petit "chargement" visuel
  return <p style={{ padding: "2rem" }}>Redirection...</p>;
}