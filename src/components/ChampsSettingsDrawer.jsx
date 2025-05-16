import React, { useEffect, useRef } from 'react';
import './css/ColumnSettingsDrawer.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function ChampsSettingsDrawer({
  isOpen,
  onClose,
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
      .from('champs_reunion')
      .update({ visible: target.visible })
      .eq('utilisateur_id', utilisateurId)
      .eq('nom_champ', champ);
  };

  return (
    <div className={`drawer-overlay ${isOpen ? 'visible' : 'hidden'}`}>
      <div className="drawer" ref={drawerRef}>
        <h2>Champs à afficher</h2>
        <p>Cliquez pour (dé)masquer</p>

        <ul className="column-list">
          {preferences.map((champ) => (
            <li className="column-item" key={champ.nom_champ}>
              <span>{champ.nom_champ.replace(/_/g, ' ')}</span>
              <button onClick={() => toggleVisibility(champ.nom_champ)}>
                {champ.visible ? (
                  <FiEye className="icon-visibility visible" />
                ) : (
                  <FiEyeOff className="icon-visibility hidden" />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="drawer-buttons">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
