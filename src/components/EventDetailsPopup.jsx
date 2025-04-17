import { useState } from 'react';
import { motion } from 'framer-motion';
import './css/QuickEventPopup.css';

export default function EventDetailsPopup({ x, y, event, calendars, onClose, onUpdate, onDelete }) {
  const [editMode, setEditMode] = useState(false);

  const [title, setTitle] = useState(event.title || '');
  const [startDate, setStartDate] = useState(event.start_time?.slice(0, 10) || '');
  const [startTime, setStartTime] = useState(event.start_time?.slice(11, 16) || '');
  const [endDate, setEndDate] = useState(event.end_time?.slice(0, 10) || '');
  const [endTime, setEndTime] = useState(event.end_time?.slice(11, 16) || '');
  const [lieu, setLieu] = useState(event.lieu || '');
  const [description, setDescription] = useState(event.description || '');
  const [recurrence, setRecurrence] = useState(event.recurrence || 'none');
  const [calendarId, setCalendarId] = useState(event.calendar_id);

  const popupWidth = 360;
  const popupHeight = 400;
  const padding = 8;

  let adjustedX = x;
  let adjustedY = y;

  if (x + popupWidth + padding > window.innerWidth) adjustedX = window.innerWidth - popupWidth - padding;
  if (adjustedX < padding) adjustedX = padding;

  const flipUp = y + popupHeight + padding > window.innerHeight;
  if (flipUp) {
    adjustedY = y - popupHeight;
    if (adjustedY < padding) adjustedY = padding;
  } else {
    if (y + popupHeight > window.innerHeight) adjustedY = window.innerHeight - popupHeight - padding;
  }

  const formatDate = (str) => {
    try {
      const date = new Date(str);
      return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return str;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime || startTime}`);
    const duration = Math.max(Math.floor((end - start) / 60000), 15);

    onUpdate({
      ...event,
      title,
      lieu,
      description,
      recurrence,
      calendar_id: calendarId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration
    });

    onClose();
  };

  return (
    <motion.div
      className="quick-popup"
      style={{ top: adjustedY, left: adjustedX }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {editMode ? (
        <form onSubmit={handleSubmit}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div className="quick-popup-dates">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <span>→</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>

          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />

          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="quick-popup-select">
            <option value="none">Une seule fois</option>
            <option value="daily">Tous les jours</option>
            <option value="weekly">Toutes les semaines</option>
            <option value="monthly">Tous les mois</option>
          </select>

          <input type="text" placeholder="Lieu" value={lieu} onChange={(e) => setLieu(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <select
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            className="quick-popup-select"
            required
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>{cal.name}</option>
            ))}
          </select>

          <div className="quick-popup-actions">
            <button type="button" onClick={() => setEditMode(false)}>Annuler</button>
            <button type="submit">Enregistrer</button>
          </div>
        </form>
      ) : (
        <div className="quick-popup-readonly">
          <h3>{event.title}</h3>
          <p><strong>🗓️</strong> {formatDate(event.start_time)} – {formatDate(event.end_time)}</p>
          {event.lieu && <p><strong>📍</strong> {event.lieu}</p>}
          {event.description && <p><strong>📝</strong> {event.description}</p>}
          {event.recurrence && event.recurrence !== 'none' && <p><strong>🔁</strong> {formatRecurrence(event.recurrence)}</p>}
          <div className="quick-popup-actions">
            <button onClick={onClose}>Fermer</button>
            <button onClick={() => setEditMode(true)}>Modifier</button>
            <button onClick={() => {
              if (confirm("Supprimer cet événement ?")) onDelete(event.id);
            }}>Supprimer</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
