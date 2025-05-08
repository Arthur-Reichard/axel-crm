import React, { useEffect, useRef } from 'react';
import './css/ColumnSettingsDrawer.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function ColumnSettingsDrawer({
  isOpen,
  onClose,
  fields,
  preferences,
  setPreferences,
  utilisateurId,
  supabase
}) {
  const drawerRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleVisibility = async (champ) => {
    const updated = preferences.map(p =>
      p.nom_champ === champ ? { ...p, visible: !p.visible } : p
    );
    setPreferences(updated);

    const target = updated.find(p => p.nom_champ === champ);
    await supabase
      .from('colonnes_leads')
      .update({ visible: target.visible })
      .eq('utilisateur_id', utilisateurId)
      .eq('nom_champ', champ);
  };

  return (
    <div className={`drawer-overlay ${isOpen ? 'visible' : 'hidden'}`}>
      <div className="drawer" ref={drawerRef}>
        <h2>Colonnes à afficher</h2>
        <p>Cliquez pour (dé)masquer</p>

        <ul className="column-list">
          {preferences.map((col) => {
            const field = fields.find(f => f.nom_champ === col.nom_champ);
            const label = field?.nom_affichage || col.nom_champ;

            return (
              <li className="column-item" key={col.nom_champ}>
                <span>{label}</span>
                <button onClick={() => toggleVisibility(col.nom_champ)}>
                {col.visible ? (
                  <FiEye className="icon-visibility visible" />
                ) : (
                  <FiEyeOff className="icon-visibility hidden" />
                )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="drawer-buttons">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}