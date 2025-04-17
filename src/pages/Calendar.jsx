// 📁 components/Calendar.jsx
import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import toast, { Toaster } from 'react-hot-toast';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

import {
  getUtilisateur,
  getCalendars,
  getEventsForCalendars,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventTime
} from '../services/calendarService';

import { supabase } from '../helper/supabaseClient';
import EventTooltip from '../components/EventTooltip';
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non connecté.");
        setUserId(user.id);

        const utilisateur = await getUtilisateur(user.id);
        let userCalendars = await getCalendars(utilisateur);

        if (userCalendars.length === 0) {
          const { data: created, error } = await supabase.from("calendars").insert([
            {
              name: utilisateur.entreprise_id ? "Calendrier entreprise" : "Calendrier personnel",
              user_id: utilisateur.entreprise_id ? null : user.id,
              entreprise_id: utilisateur.entreprise_id || null,
              color: utilisateur.entreprise_id ? "#1E90FF" : "#4CAF50"
            }
          ]).select();

          if (error) throw error;
          userCalendars = created;
        }

        setCalendars(userCalendars);
        setSelectedCalendars(userCalendars.map(c => c.id));

        const calendarIds = userCalendars.map(c => c.id);
        const allEvents = await getEventsForCalendars(calendarIds);
        setEvents(allEvents);

        setNewEvent(prev => ({ ...prev, calendar_id: userCalendars[0].id }));
      } catch (err) {
        toast.error("Erreur : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!userId || calendars.length === 0) return;
    const channel = supabase.channel('events-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events'
    }, async () => {
      const calendarIds = calendars.map((c) => c.id);
      const allEvents = await getEventsForCalendars(calendarIds);
      setEvents(allEvents);
    }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, calendars]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_time || !newEvent.calendar_id) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    try {
      const evt = await createEvent(newEvent);
      setEvents(prev => [...prev, evt]);
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
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
      setDrawerOpen(false);
      setEventToEdit(null);
      toast.success("Événement mis à jour !");
    } catch (err) {
      toast.error("Erreur mise à jour : " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${eventToEdit.title}" ?`)) return;
    try {
      await deleteEvent(eventToEdit.id);
      setEvents(prev => prev.filter(ev => ev.id !== eventToEdit.id));
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
      start_time: arg.dateStr.slice(0, 16),
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
    tippy(info.el, { content, placement: 'top', allowHTML: true, theme: 'light' });
  };

  const handleEventDrop = async (info) => {
    try {
      const updated = await updateEventTime({
        id: info.event.id,
        start_time: info.event.start,
        end_time: info.event.end || new Date(info.event.start.getTime() + 3600000)
      });
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
      toast.success("Événement déplacé !");
    } catch (err) {
      toast.error("Erreur déplacement : " + err.message);
      info.revert();
    }
  };

  const handleEventResize = async (info) => {
    try {
      const updated = await updateEventTime({
        id: info.event.id,
        start_time: info.event.start,
        end_time: info.event.end
      });
      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
      toast.success("Durée mise à jour !");
    } catch (err) {
      toast.error("Erreur redimensionnement : " + err.message);
      info.revert();
    }
  };

  const displayedEvents = events.filter(evt => selectedCalendars.includes(evt.calendar_id)).map(evt => ({
    ...evt,
    start: evt.start_time,
    end: evt.end_time
  }));

  if (loading) return <p className="my-calendar-app-loading">Chargement du calendrier...</p>;

  return (
    <div className="my-calendar-app">
      <Toaster position="top-right" />

      <div className="my-calendar-sidebar">
        <div className="my-calendar-create-wrapper">
          <button className="my-calendar-create-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <span>＋</span> Créer <span>▾</span>
          </button>
          {showDropdown && (
            <div className="my-calendar-dropdown">
              <div onClick={() => { setEventToEdit(null); setDrawerOpen(true); }}>Événement</div>
              <div onClick={() => toast('Tâche à venir')}>Tâche</div>
              <div onClick={() => toast('Planning à venir')}>Planning</div>
            </div>
          )}
        </div>

        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
          height="auto"
          fixedWeekCount={false}
          dayMaxEventRows={1}
          selectable
          datesSet={(arg) => setCurrentDate(arg.start)}
          dateClick={(arg) => {
            setCurrentDate(arg.date);
            calendarRef.current?.getApi().gotoDate(arg.date);
          }}
        />

        <h3>Mes agendas</h3>
        {calendars.map(cal => (
          <label key={cal.id}>
            <input
              type="checkbox"
              checked={selectedCalendars.includes(cal.id)}
              onChange={() => {
                const newList = selectedCalendars.includes(cal.id)
                  ? selectedCalendars.filter(id => id !== cal.id)
                  : [...selectedCalendars, cal.id];
                setSelectedCalendars(newList);
              }}
            />
            <span style={{ color: cal.color }}>{cal.name}</span>
          </label>
        ))}
      </div>

      <div className="my-calendar-main">
        <div className="my-calendar-header">
          <h1>Mon calendrier</h1>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          ref={calendarRef}
          editable
          selectable
          eventResizableFromStart
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

      {drawerOpen && (
        <>
          <div className="my-calendar-overlay" onClick={() => { setDrawerOpen(false); setEventToEdit(null); }}></div>
          <div className="my-calendar-drawer">
            <div className="my-calendar-drawer-header">
              <h2>{eventToEdit ? "Modifier l’événement" : "Créer un événement"}</h2>
              <button className="my-calendar-close-btn" onClick={() => { setDrawerOpen(false); setEventToEdit(null); }}>&times;</button>
            </div>

            <form className="my-calendar-form" onSubmit={eventToEdit ? handleUpdate : handleCreate}>
              <label>Titre</label>
              <input type="text" value={eventToEdit ? eventToEdit.title ?? '' : newEvent.title} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, title: e.target.value }) : setNewEvent(prev => ({ ...prev, title: e.target.value }))} required />

              <label>Description</label>
              <textarea rows={3} value={eventToEdit ? eventToEdit.description ?? '' : newEvent.description ?? ''} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, description: e.target.value }) : setNewEvent(prev => ({ ...prev, description: e.target.value }))} />

              <label>Lieu</label>
              <input type="text" value={eventToEdit ? eventToEdit.lieu ?? '' : newEvent.lieu ?? ''} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, lieu: e.target.value }) : setNewEvent(prev => ({ ...prev, lieu: e.target.value }))} />

              <label>Durée (en minutes)</label>
              <input type="number" min={15} max={480} step={15} value={eventToEdit ? eventToEdit.duration ?? 60 : newEvent.duration ?? 60} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, duration: parseInt(e.target.value) }) : setNewEvent(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />

              <label>Date & heure</label>
              <input type="datetime-local" value={eventToEdit ? eventToEdit.start_time?.slice(0, 16) : newEvent.start_time} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, start_time: e.target.value }) : setNewEvent(prev => ({ ...prev, start_time: e.target.value }))} required />

              <label>Calendrier utilisé</label>
              <select value={eventToEdit ? eventToEdit.calendar_id : newEvent.calendar_id} onChange={(e) => eventToEdit ? setEventToEdit({ ...eventToEdit, calendar_id: e.target.value }) : setNewEvent(prev => ({ ...prev, calendar_id: e.target.value }))} required>
                {calendars.map(cal => <option key={cal.id} value={cal.id}>{cal.name || "Calendrier"}</option>)}
              </select>

              <button type="submit" className="my-calendar-submit-btn">{eventToEdit ? "Mettre à jour" : "Créer l’événement"}</button>
              {eventToEdit && <button type="button" className="my-calendar-delete-btn" onClick={handleDelete}>Supprimer</button>}
            </form>
          </div>
        </>
      )}
    </div>
  );
}