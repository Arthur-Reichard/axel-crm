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
  updateEvent,
  deleteEvent
} from '../services/calendarService';
import { supabase } from '../helper/supabaseClient';
import './css/Calendar.css';

export default function Calendar() {
  const [userId, setUserId] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start_time: '', calendar_id: '' });
  const [eventToEdit, setEventToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non connecté.");
        setUserId(user.id);

        const utilisateur = await getUtilisateur(user.id);
        let calendars = await getCalendars(utilisateur);

        if (calendars.length === 0) {
          const { data: created, error } = await supabase
            .from("calendars")
            .insert([{
              name: utilisateur.entreprise_id ? "Calendrier entreprise" : "Calendrier personnel",
              user_id: utilisateur.entreprise_id ? null : user.id,
              entreprise_id: utilisateur.entreprise_id || null,
              color: utilisateur.entreprise_id ? "#1E90FF" : "#4CAF50"
            }])
            .select();

          if (error) throw error;
          calendars = created;
        }

        setCalendars(calendars);
        setSelectedCalendars(calendars.map((c) => c.id));

        const calendarIds = calendars.map((c) => c.id);
        const allEvents = await getEventsForCalendars(calendarIds);
        setEvents(allEvents);

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
      const evt = await createEvent(newEvent);
      setEvents((prev) => [...prev, evt]);
      setDrawerOpen(false);
      setNewEvent({ title: '', start_time: '', calendar_id: calendars[0]?.id || '' });
      toast.success("Événement créé !");
    } catch (err) {
      toast.error("Erreur création : " + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateEvent(eventToEdit);
      setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? updated : ev)));
      setDrawerOpen(false);
      setEventToEdit(null);
      toast.success("Événement mis à jour !");
    } catch (err) {
      toast.error("Erreur mise à jour : " + err.message);
    }
  };

  const handleDeleteConfirmed = async () => {
    const confirmDel = confirm(`Supprimer "${eventToEdit.title}" ?`);
    if (!confirmDel) return;
    try {
      await deleteEvent(eventToEdit.id);
      setEvents((prev) => prev.filter((evt) => evt.id !== eventToEdit.id));
      setDrawerOpen(false);
      setEventToEdit(null);
      toast.success("Événement supprimé.");
    } catch (err) {
      toast.error("Erreur suppression : " + err.message);
    }
  };

  const handleEventClick = (clickInfo) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (!event) return;
    setEventToEdit(event);
    setDrawerOpen(true);
  };

  if (loading) return <p style={{ padding: '2rem' }}>Chargement du calendrier...</p>;

  return (
    <div className="calendar-container">
      <Toaster position="top-right" />

      <div className="calendar-sidebar">
        <h3>Mes agendas</h3>
        {calendars.map((cal) => (
          <label key={cal.id} style={{ display: 'block', marginBottom: '4px' }}>
            <input
              type="checkbox"
              checked={selectedCalendars.includes(cal.id)}
              onChange={() => {
                if (selectedCalendars.includes(cal.id)) {
                  setSelectedCalendars(selectedCalendars.filter(id => id !== cal.id));
                } else {
                  setSelectedCalendars([...selectedCalendars, cal.id]);
                }
              }}
            />
            <span style={{ marginLeft: '8px', color: cal.color }}>{cal.name}</span>
          </label>
        ))}
      </div>

      <div style={{ flexGrow: 1, paddingLeft: '1rem' }}>
        <div className="calendar-header">
          <h1>Mon calendrier</h1>
          <button className="add-event-button" onClick={() => {
            setEventToEdit(null);
            setDrawerOpen(true);
          }}>
            + Nouvel événement
          </button>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events.filter(evt => selectedCalendars.includes(evt.calendar_id))}
          eventClick={handleEventClick}
          height="auto"
        />
      </div>

      {drawerOpen && (
        <>
          <div className="calendar-overlay" onClick={() => {
            setDrawerOpen(false);
            setEventToEdit(null);
          }}></div>
          <div className="calendar-drawer">
            <div className="calendar-drawer-header">
              <h2>{eventToEdit ? "Modifier l’événement" : "Créer un événement"}</h2>
              <button onClick={() => {
                setDrawerOpen(false);
                setEventToEdit(null);
              }} className="close-drawer">&times;</button>
            </div>

            <form
              className="calendar-form"
              onSubmit={eventToEdit ? handleUpdate : handleCreate}
            >
              <label>Titre</label>
              <input
                type="text"
                value={eventToEdit ? eventToEdit.title : newEvent.title}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, title: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <label>Date & heure</label>
              <input
                type="datetime-local"
                value={eventToEdit ? eventToEdit.start.slice(0, 16) : newEvent.start_time}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, start: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, start_time: e.target.value }))
                }
                required
              />

              <label>Calendrier utilisé</label>
              <select
                value={eventToEdit ? eventToEdit.calendar_id : newEvent.calendar_id}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, calendar_id: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, calendar_id: e.target.value }))
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
                {eventToEdit ? "Mettre à jour" : "Créer l’événement"}
              </button>

              {eventToEdit && (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleDeleteConfirmed}
                  style={{ backgroundColor: "#ccc", color: "#000" }}
                >
                  Supprimer l’événement
                </button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}