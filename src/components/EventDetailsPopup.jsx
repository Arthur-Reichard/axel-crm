import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useClickAway } from 'ahooks';
import './css/EventDetailsPopup.css';

export default function EventDetailsPopup({ x, y, event, calendars, onClose, onUpdate, onDelete }) {
  const popupRef = useRef(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...event });

  useClickAway(() => onClose(), popupRef);

  const padding = 20;
  const popupWidth = 440;
  const popupHeight = 450;

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
      style={{ top: adjustedY, left: adjustedX }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {editMode ? (
        <form onSubmit={handleSubmit}>
          <input
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <input
            value={form.lieu}
            onChange={(e) => handleChange('lieu', e.target.value)}
          />
          <input
            type="datetime-local"
            value={form.start_time.slice(0, 16)}
            onChange={(e) => handleChange('start_time', e.target.value)}
            required
          />
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

          <div className="popup-actions">
            <button type="button" onClick={() => setEditMode(true)}>✎ Modifier</button>
            <button type="button" onClick={onDelete}>🗑 Supprimer</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}