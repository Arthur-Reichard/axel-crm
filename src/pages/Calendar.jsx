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
  deleteEvent,
  updateEventTime // 👈 ajoute celui-ci
} from '../services/calendarService';
import { supabase } from '../helper/supabaseClient';
import './css/Calendar.css';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import EventTooltip from '../components/EventTooltip';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

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
  
    loadAllEvents(); // ✅ une seule fois ici
  }, []);
  
  // ✅ Synchronisation automatique en temps réel
  useEffect(() => {
    if (!userId || calendars.length === 0) return;
  
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        async (payload) => {
          console.log('🔄 Changement détecté dans events :', payload);
  
          const calendarIds = calendars.map((c) => c.id);
          const allEvents = await getEventsForCalendars(calendarIds);
          setEvents(allEvents);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, calendars]);
  

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
      console.log("🔧 eventToEdit:", eventToEdit);
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

  const handleDateClick = (arg) => {
    setEventToEdit(null);
    setNewEvent({
      title: '',
      start_time: arg.dateStr.slice(0, 16), // format ISO
      calendar_id: calendars[0]?.id || '',
      description: '',
      lieu: '',
      duration: 60
    });
    setDrawerOpen(true);
  };

  const handleTooltip = (info) => {
    const event = events.find(e => e.id === info.event.id);
    if (!event) return;
  
    const content = `
      <strong>${event.title}</strong><br/>
      ${event.lieu ? '📍 ' + event.lieu + '<br/>' : ''}
      ${event.description ? event.description + '<br/>' : ''}
      ${event.duration ? '⏱️ ' + event.duration + ' min' : ''}
    `;
  
    tippy(info.el, {
      content,
      placement: 'top',
      allowHTML: true,
      theme: 'light',
    });
  };

  const handleEventDrop = async (info) => {
    const { id } = info.event;
    const start = info.event.start;
    const end = info.event.end || new Date(start.getTime() + 60 * 60 * 1000); // fallback
  
    try {
      const updated = await updateEventTime({ id, start_time: start, end_time: end });
      setEvents((prev) => prev.map(ev => ev.id === id ? updated : ev));
      toast.success("Événement déplacé !");
    } catch (err) {
      toast.error("Erreur déplacement : " + err.message);
      info.revert(); // rollback UI
    }
  };
  
  const handleEventResize = async (info) => {
    const { id } = info.event;
    const start = info.event.start;
    const end = info.event.end;
  
    try {
      const updated = await updateEventTime({ id, start_time: start, end_time: end });
      setEvents((prev) => prev.map(ev => ev.id === id ? updated : ev));
      toast.success("Durée mise à jour !");
    } catch (err) {
      toast.error("Erreur redimensionnement : " + err.message);
      info.revert();
    }
  };  

  if (loading) return <p style={{ padding: '2rem' }}>Chargement du calendrier...</p>;

  const displayedEvents = events
  .filter(evt => selectedCalendars.includes(evt.calendar_id))
  .map(evt => ({
    ...evt,
    start: evt.start_time,
    end: evt.end_time
  }));

  const renderEventContent = (arg) => {
    const event = events.find(e => e.id === arg.event.id);
    if (!event) return arg.event.title;
  
    return (
      <EventTooltip event={event}>
        <div>{event.title}</div>
      </EventTooltip>
    );
  };

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

      <div className="calendar-main">
      <div className="calendar-header">
        <h1>Mon calendrier</h1>
        <button className="add-event-button" onClick={() => {
          setEventToEdit(null);
          setDrawerOpen(true);
        }}>
          + Nouvel événement
        </button>
      </div>
      <div className="calendar-main">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        eventResizableFromStart={true}
        events={displayedEvents}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        dateClick={handleDateClick}
        eventDidMount={handleTooltip}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        buttonText={{
          today: 'Aujourd\'hui',
          month: 'Mois',
          week: 'Semaine',
          day: 'Jour',
          list: 'Liste'
        }}
      />
      </div>


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
                value={eventToEdit ? eventToEdit.title ?? "" : newEvent.title}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, title: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />

              <label>Description</label>
              <textarea
                rows={3}
                value={eventToEdit ? eventToEdit.description ?? "" : newEvent.description ?? ""}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, description: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, description: e.target.value }))
                }
              />

              <label>Lieu</label>
              <input
                type="text"
                placeholder="Ex: Bâtiment A, salle 204"
                value={eventToEdit ? eventToEdit.lieu ?? "" : newEvent.lieu ?? ""}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, lieu: e.target.value })
                    : setNewEvent((prev) => ({ ...prev, lieu: e.target.value }))
                }
              />

              <label>Durée (en minutes)</label>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                value={eventToEdit ? eventToEdit.duration ?? 60 : newEvent.duration ?? 60}
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, duration: parseInt(e.target.value) })
                    : setNewEvent((prev) => ({ ...prev, duration: parseInt(e.target.value) }))
                }
              />

              <label>Date & heure</label>
              <input
                type="datetime-local"
                value={
                  eventToEdit
                    ? eventToEdit.start_time
                      ? eventToEdit.start_time.slice(0, 16)
                      : ""
                    : newEvent.start_time
                }                
                onChange={(e) =>
                  eventToEdit
                    ? setEventToEdit({ ...eventToEdit, start_time: e.target.value })
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