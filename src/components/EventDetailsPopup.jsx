import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useClickAway } from 'ahooks';
import './css/EventDetailsPopup.css';

export default function EventDetailsPopup({ x, y, event, calendars, onClose, onUpdate, onDelete }) {
  const popupRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...event });

  useClickAway((e) => {
    if (!editMode) onClose();
  }, popupRef);

  const padding = 20;
  const popupWidth = editMode ? 460 : 620;
  const popupHeight = editMode ? 550 : 500;

  const adjustedX = Math.max(padding, Math.min(x, window.innerWidth - popupWidth - padding));
  const adjustedY = Math.max(padding, Math.min(y, window.innerHeight - popupHeight - padding));

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(form);
    setEditMode(false);
    onClose();
  };

  return (
    <motion.div
      ref={popupRef}
      className="event-details-popup"
      style={{ top: adjustedY, left: adjustedX, width: popupWidth }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {editMode ? (
        <form onSubmit={handleSubmit} className="event-edit-form">
          <input
            placeholder="Titre"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <textarea
            placeholder="Description"
            value={form.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <input
            placeholder="Lieu"
            value={form.lieu || ''}
            onChange={(e) => handleChange('lieu', e.target.value)}
          />
          <input
            type="datetime-local"
            value={form.start_time?.slice(0, 16)}
            onChange={(e) => handleChange('start_time', e.target.value)}
            required
          />
          <input
            type="number"
            min="5"
            step="5"
            value={form.duration || 60}
            onChange={(e) => handleChange('duration', parseInt(e.target.value, 10))}
            placeholder="Durée (min)"
          />

          {/* Optionnel : si tu veux permettre de changer de calendrier */}
          {calendars?.length > 1 && (
            <select
              value={form.calendar_id}
              onChange={(e) => handleChange('calendar_id', e.target.value)}
            >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.type === 'pro' ? 'Calendrier pro' : 'Calendrier perso'}
              </option>
            ))}
            </select>
          )}

          <div className="popup-actions">
            <button type="submit">✅ Enregistrer</button>
            <button type="button" onClick={() => setEditMode(false)}>❌ Annuler</button>
          </div>
        </form>
      ) : (
        <div>
          <h3>{event.title}</h3>
          {event.description && <p>{event.description}</p>}
          {event.lieu && <p>📍 {event.lieu}</p>}
          <p>🕒 {new Date(event.start_time).toLocaleString()}</p>
          {event.duration && <p>⏱ {event.duration} minutes</p>}
          {event.invites && event.invites.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4>👥 Participants</h4>
              <ul style={{ paddingLeft: '1rem' }}>
                {event.invites.map(invite => {
                  const statut = invite.statut;
                  const user = invite.utilisateurs;
                  const label =
                    statut === 'accepte' ? '✅ Accepté' :
                    statut === 'refuse' ? '❌ Refusé' :
                    '⏳ En attente';

                  return (
                    <li key={invite.id}>
                      {invite.utilisateur?.prenom} {invite.utilisateur?.nom} ({invite.utilisateur?.email}) – <strong>{label}</strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="popup-actions">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditMode(true);
              }}
            >
              ✎ Modifier
            </button>
            <button type="button" onClick={onDelete}>🗑 Supprimer</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
