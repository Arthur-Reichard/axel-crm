import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../helper/supabaseClient';
import "../pages/css/userMenu.css";

function UserMenu({ darkMode, toggleMode }) {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();

  // Récupérer l'email à la connexion
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUserEmail(user.email);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/");
  };

  return (
    <div className="user-menu-wrapper">
      <button onClick={() => setOpen(!open)} className="user-avatar">
        👤
      </button>

      {open && (
        <div className="user-menu">
          <div className="user-email">{userEmail || "Utilisateur"}</div>

          <ul className="user-links">
            <li><a href="/MyUserProfil">Mon profil</a></li>
            <li><a href="#">Mon offre</a></li>
            <li><a href="#">Paramètres</a></li>
            <li><a href="#">Empreinte carbone</a></li>
          </ul>

          <div className="theme-toggle">
            <span>Thème foncé</span>
            <label className="switch">
              <input type="checkbox" checked={darkMode} onChange={toggleMode} />
              <span className="slider round"></span>
            </label>
          </div>

          <hr />

          <button onClick={handleLogout} className="logout-button">
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;