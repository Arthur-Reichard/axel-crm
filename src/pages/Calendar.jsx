// 📁 components/Calendar.jsx
import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import toast, { Toaster } from 'react-hot-toast';
import {
  getUtilisateur,
  getCalendars,
  getEventsForCalendars,
  createEvent,
  deleteEvent
} from '../services/calendarService';
import { supabase } from '../helper/supabaseClient';
import './css/Calendar.css';

export default function Calendar() {
  const [userId, setUserId] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start_time: '', calendar_id: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non connecté.");
        setUserId(user.id);

        const utilisateur = await getUtilisateur(user.id);
        const calendars = await getCalendars(utilisateur);
        setCalendars(calendars);

        const calendarIds = calendars.map((c) => c.id);
        const allEvents = await getEventsForCalendars(calendarIds);
        setEvents(allEvents);

        // Fix: affecter automatiquement le premier calendrier pour le drawer
        if (calendars.length > 0) {
          setNewEvent((prev) => ({ ...prev, calendar_id: calendars[0].id }));
        }
      } catch (err) {
        toast.error("Erreur : " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!newEvent.title.trim() || !newEvent.start_time || !newEvent.calendar_id) {
        toast.error("Merci de remplir tous les champs.");
        return;
      }
      console.log("Création event avec :", newEvent);
      const evt = await createEvent(newEvent);
      setEvents((prev) => [...prev, evt]);
      setDrawerOpen(false);
      setNewEvent({ title: '', start_time: '', calendar_id: calendars[0]?.id || '' });
      toast.success("Événement créé !");
    } catch (err) {
      toast.error("Erreur création : " + err.message);
    }
  };

  const handleDelete = async (clickInfo) => {
    const confirmDelete = confirm(`Supprimer "${clickInfo.event.title}" ?`);
    if (!confirmDelete) return;
    try {
      await deleteEvent(clickInfo.event.id);
      setEvents((prev) => prev.filter((evt) => evt.id !== clickInfo.event.id));
      toast.success("Événement supprimé.");
    } catch (err) {
      toast.error("Erreur suppression : " + err.message);
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Chargement du calendrier...</p>;

  return (
    <div className="calendar-container">
      <Toaster position="top-right" />

      <div className="calendar-header">
        <h1>Mon calendrier</h1>
        <button className="add-event-button" onClick={() => setDrawerOpen(true)}>
          + Nouvel événement
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events} // couleurs définies dans getEventsForCalendars()
        eventClick={handleDelete}
        height="auto"
      />

      {drawerOpen && (
        <>
          <div className="calendar-overlay" onClick={() => setDrawerOpen(false)}></div>

          <div className="calendar-drawer">
            <div className="calendar-drawer-header">
              <h2>Créer un événement</h2>
              <button onClick={() => setDrawerOpen(false)} className="close-drawer">&times;</button>
            </div>

            <form className="calendar-form" onSubmit={handleCreate}>
              <label>Titre</label>
              <input
                type="text"
                placeholder="Nom de l’événement"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <label>Date & heure</label>
              <input
                type="datetime-local"
                value={newEvent.start_time}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, start_time: e.target.value }))
                }
                required
              />

              <label>Calendrier utilisé (auto)</label>
              <select
                value={newEvent.calendar_id}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, calendar_id: e.target.value }))
                }
                required
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name || "Calendrier"}
                  </option>
                ))}
              </select>

              <button type="submit" className="submit-button">
                Enregistrer l’événement
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}