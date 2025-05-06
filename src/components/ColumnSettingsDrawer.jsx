import React from 'react';
import './css/ColumnSettingsDrawer.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function ColumnSettingsDrawer({ isOpen, onClose, fields, preferences, setPreferences, utilisateurId, supabase }) {
  if (!isOpen) return null;

  const handleDragEnd = async (result) => {
    console.log(result);
    if (!result.destination) return;

    const items = Array.from(preferences);
    const [movedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, movedItem);

    // mise à jour des ordres localement
    const updated = items.map((item, index) => ({
      ...item,
      ordre: index
    }));

    setPreferences(updated);

    // mise à jour en BDD
    for (const item of updated) {
      await supabase
        .from('colonnes_leads')
        .update({ ordre: item.ordre })
        .eq('utilisateur_id', utilisateurId)
        .eq('nom_champ', item.nom_champ);
    }
  };

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
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <h2>Colonnes à afficher</h2>
        <p>Glissez pour réordonner, cliquez pour (dé)masquer</p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <ul
              className="column-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
              key="droppable-column-list"
            >            
                {preferences.map((col, index) => {
                  const field = fields.find(f => f.nom_champ === col.nom_champ);
                  const label = field?.nom_affichage || col.nom_champ;

                  return (
                    <Draggable key={`champ-${col.nom_champ}`} draggableId={`champ-${col.nom_champ}`} index={index}>
                      {(provided) => (
                        <li
                          key={`champ-${col.nom_champ}`}
                          className="column-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <span>{label}</span>
                          <button onClick={() => toggleVisibility(col.nom_champ)}>
                            {col.visible ? <FiEye /> : <FiEyeOff />}
                          </button>
                        </li>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        <div className="drawer-buttons">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}