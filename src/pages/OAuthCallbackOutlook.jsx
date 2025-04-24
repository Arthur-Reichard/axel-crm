// src/pages/OAuthCallbackOutlook.jsx
import { useEffect } from "react";
import { supabase } from "../helper/supabaseClient";

export default function OAuthCallbackOutlook() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    const envoyerCode = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      await fetch("http://localhost:8000/oauth/callback/outlook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          utilisateur_id: user.id,
        }),
      });
    };

    if (code) envoyerCode();
  }, []);

  return <p>Connexion à Outlook en cours...</p>;
}