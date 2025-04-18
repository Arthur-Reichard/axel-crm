import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './css/QuickEventPopup.css';

const formatDate = (dateStr) => {
  try {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', options);
  } catch {
    return dateStr;
  }
};

const formatRecurrence = (value) => {
  switch (value) {
    case 'daily': return 'Tous les jours';
    case 'weekly': return 'Toutes les semaines';
    case 'monthly': return 'Tous les mois';
    default: return 'Une seule fois';
  }
};

export default function QuickEventPopup({
  x, y, date, calendars,
  utilisateursEntreprise = [],
  onClose, onSave, onMoreOptions
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [lieu, setLieu] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [showDateFields, setShowDateFields] = useState(false);
  const [calendarId, setCalendarId] = useState('');
  const [invites, setInvites] = useState([]);
  const popupRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (date) {
      const formatted = new Date(date).toISOString().slice(0, 10);
      setStartDate(formatted);
      setEndDate(formatted);
    }
    if (calendars && calendars.length > 0) {
      setCalendarId(calendars[0].id);
    }
  }, [date, calendars]);

  const padding = 50;
  const popupWidth = 500;
  const popupHeight = 600;
  let adjustedX = Math.max(padding, Math.min(x, window.innerWidth - popupWidth - padding));
  let adjustedY = Math.max(padding, Math.min(y, window.innerHeight - popupHeight - padding))

  const handleSubmit = (e) => {
    e.preventDefault();

    const start = new Date(`${startDate}T${showTimeFields ? startTime || '00:00' : '00:00'}`);
    const end = new Date(`${endDate}T${showTimeFields ? endTime || startTime || '00:00' : '23:59'}`);
    const duration = Math.max(Math.floor((end - start) / 60000), 15);

    onSave({
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      lieu,
      description,
      recurrence,
      duration,
      calendar_id: calendarId,
      invites
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
      <form onSubmit={handleSubmit} ref={popupRef}>
        <input
          type="text"
          placeholder="Ajouter un titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {!showDateFields ? (
          <div className="quick-popup-summary-row">
            <div className="quick-popup-summary" onClick={() => setShowDateFields(true)}>
              <div className="quick-popup-summary-header">
                <span className="icon">🕒</span>
                <div className="quick-popup-date-recurrence">
                  <div className="quick-popup-date-text">
                    {formatDate(startDate)} – {formatDate(endDate)}
                  </div>
                  <div className="quick-popup-recurrence-text">
                    {formatRecurrence(recurrence)}
                  </div>
                </div>
              </div>
            </div>
            {!showTimeFields && (
              <button
                type="button"
                className="quick-popup-time-btn"
                onClick={() => setShowTimeFields(true)}
              >
                Préciser l'heure
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="quick-popup-dates">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <span>→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>

            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="quick-popup-select"
            >
              <option value="none">Une seule fois</option>
              <option value="daily">Tous les jours</option>
              <option value="weekly">Toutes les semaines</option>
              <option value="monthly">Tous les mois</option>
            </select>
          </>
        )}

        {showTimeFields && (
          <>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </>
        )}

        <input
          type="text"
          placeholder="Ajouter lieu"
          value={lieu}
          onChange={(e) => setLieu(e.target.value)}
        />

        <textarea
          placeholder="Ajouter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className="quick-popup-label">
          Inviter des membres :
          <select
            multiple
            value={invites}
            onChange={(e) => setInvites(Array.from(e.target.selectedOptions, (o) => o.value))}
            className="quick-popup-select"
          >
            {utilisateursEntreprise.map((user) => (
              <option key={user.id} value={user.id}>
                {user.prenom} {user.nom} ({user.email})
              </option>
            ))}
          </select>
        </label>

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
          <button type="button" onClick={onClose}>Annuler</button>
          <button type="submit">Enregistrer</button>
        </div>
      </form>
    </motion.div>
  );
}
