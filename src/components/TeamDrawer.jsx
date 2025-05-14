import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import { FiSettings } from "react-icons/fi";
import "./css/TeamDrawer.css";

export default function TeamDrawer({ onSelect, selectedId, refreshTrigger }) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('employes')
        .select('id, prenom, nom, poste, photo_url')
        .order('nom');
      if (!error) setEmployees(data);
    };
    fetchData();
  }, [refreshTrigger]); 

  return (
    <div className="team-drawer">
      <div className="drawer-scroll">
        {employees.map(emp => (
          <div
            key={emp.id}
            className={`drawer-item ${emp.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(emp)}
          >
            <div className="avatar">
              {emp.photo_url ? (
                <img src={emp.photo_url} alt="avatar" className="avatar-img" />
              ) : (
                <span>
                  {(emp.prenom?.[0] || '').toUpperCase()}
                  {(emp.nom?.[0] || '').toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div><strong>{emp.prenom} {emp.nom}</strong></div>
              <div className="poste-text">{emp.poste}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton réglages */}
      <div className="drawer-footer">
        <button className="settings-button" onClick={() => console.log("Ouverture des réglages à venir")}>
          <FiSettings />
          Réglages
        </button>
      </div>
    </div>
  );
}