import React, { useEffect, useState } from "react";
import supabase from "../helper/supabaseClient";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard"; // Import direct ici

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
    return <div>Loading...</div>;
  } else {
    if (authenticated) {
      // Appel direct de Dashboard avec les props
      return <Dashboard darkMode={darkMode} toggleMode={toggleMode} />;
    }
    return <Navigate to="/login" />;
  }
}

export default Wrapper;
