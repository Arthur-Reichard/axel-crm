import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { Navigate, Outlet } from "react-router-dom";

function Wrapper({ darkMode, toggleMode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      setLoading(false);
    };

    getSession();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  // ✅ Si connecté, on affiche les routes imbriquées
  return <Outlet />;
}

export default Wrapper;