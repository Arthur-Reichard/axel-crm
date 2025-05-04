import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../helper/supabaseClient';
import "../pages/css/userMenu.css";

function UserMenu({ darkMode, toggleMode }) {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setUserEmail(user.email);
        const { data: userData } = await supabase
          .from("utilisateurs")
          .select("avatar_url")
          .eq("id", user.id)
          .single();
        if (userData?.avatar_url) {
          setAvatarUrl(userData.avatar_url);
        }
      }
    };
    fetchUser();
  }, []);

  // 🔒 Fermer menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate("/");
  };

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button onClick={() => setOpen(!open)} className="user-avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="user-avatar-img" />
        ) : (
          "👤"
        )}
      </button>

      {open && (
        <div className="user-menu">
          <div className="user-email">{userEmail || "Utilisateur"}</div>

          <ul className="user-links">
            <li><a href="/axel-crm/MyUserProfil">Mon profil</a></li>
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
