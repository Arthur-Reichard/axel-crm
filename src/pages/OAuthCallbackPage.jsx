import { useEffect } from "react";
import { supabase } from "../helper/supabaseClient";

export default function OAuthCallbackPage() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    const handleOAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          redirect_uri: "http://localhost:3000/oauth/callback",
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token } = tokens;

      const userinfo = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => res.json());

      const email = userinfo.email;

      const { error } = await supabase.from("comptes_email").insert({
        utilisateur_id: user.id,
        fournisseur: "gmail",
        email: email,
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("❌ Erreur insertion Supabase :", error);
      } else {
        console.log("✅ Compte Gmail enregistré :", email);
      }
    };

    if (code) {
      handleOAuth();
    }
  }, []);

  return <p>Connexion Gmail en cours...</p>;
}