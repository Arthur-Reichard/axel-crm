import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { supabase } from '../helper/supabaseClient';
import './css/Calendar.css'

export default function Calendar({ userId }) {
  const [calendars, setCalendars] = useState([])
  const [selectedCalendar, setSelectedCalendar] = useState(null)
  const [events, setEvents] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', start_time: '', calendar_id: '' })

  useEffect(() => {
    if (userId) {
      console.log("🧩 userId reçu :", userId)
      fetchCalendars()
    }
  }, [userId])

  const fetchCalendars = async () => {
    const { data: utilisateur, error: userError } = await supabase
      .from("utilisateurs")
      .select("id, entreprise_id, statut")
      .eq("id", userId)
      .single()

    if (userError || !utilisateur) {
      console.error("❌ Utilisateur non trouvé :", userError)
      return
    }

    const { id: utilisateurId, entreprise_id, statut } = utilisateur
    let calendarsList = []

    const { data: persoCal } = await supabase
      .from("calendars")
      .select("*")
      .eq("user_id", utilisateurId)

    if (persoCal) calendarsList = [...calendarsList, ...persoCal]

    if ((statut === "ENTREPRISE" || statut === "ASSO") && entreprise_id) {
      const { data: entCal } = await supabase
        .from("calendars")
        .select("*")
        .eq("entreprise_id", entreprise_id)

      if (entCal) calendarsList = [...calendarsList, ...entCal]
    }

    if (calendarsList.length === 0) {
      console.warn("⚠️ Aucun calendrier trouvé.")
      return
    }

    console.log("📅 Calendriers récupérés :", calendarsList)
    setCalendars(calendarsList)
    setSelectedCalendar(calendarsList[0])
    setNewEvent((prev) => ({ ...prev, calendar_id: calendarsList[0].id }))
    fetchEvents(calendarsList[0].id)
  }

  const fetchEvents = async (calendarId) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("calendar_id", calendarId)

    if (!error && data) {
      const formatted = data.map(e => ({
        id: e.id,
        title: e.title,
        start: e.start_time,
        end: e.end_time,
      }))
      setEvents(formatted)
    }
  }

  useEffect(() => {
    if (selectedCalendar?.id) {
      fetchEvents(selectedCalendar.id)
      setNewEvent((prev) => ({ ...prev, calendar_id: selectedCalendar.id }))
    }
  }, [selectedCalendar])

  const handleEventCreation = async (e) => {
    e.preventDefault()
    const { title, start_time, calendar_id } = newEvent

    if (!title.trim() || !start_time || !calendar_id) {
      alert("Merci de remplir tous les champs.")
      return
    }

    const start = new Date(start_time)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    const { data: insertedEvent, error } = await supabase
      .from("events")
      .insert([{
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        calendar_id,
      }])
      .select()
      .single()

    if (error) {
      alert("Erreur création événement : " + error.message)
      return
    }

    setEvents((prev) => [...prev, {
      id: insertedEvent.id,
      title: insertedEvent.title,
      start: insertedEvent.start_time,
      end: insertedEvent.end_time
    }])

    setNewEvent({ title: '', start_time: '', calendar_id })
    setDrawerOpen(false)
  }

  const handleEventDelete = async (clickInfo) => {
    if (!selectedCalendar) return
    if (confirm(`Supprimer "${clickInfo.event.title}" ?`)) {
      await supabase.from('events').delete().eq('id', clickInfo.event.id)
      fetchEvents(selectedCalendar.id)
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Mon calendrier</h1>

        {calendars.length > 0 ? (
          <select
            value={selectedCalendar?.id || ''}
            onChange={(e) => {
              const cal = calendars.find(c => c.id === e.target.value)
              setSelectedCalendar(cal)
            }}
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.name || (cal.entreprise_id ? "🧑‍💼 Entreprise" : "👤 Personnel")}
              </option>
            ))}
          </select>
        ) : (
          <p style={{ color: '#999' }}>Aucun calendrier disponible</p>
        )}

        <button className="add-event-button" onClick={() => setDrawerOpen(true)}>
          + Nouvel événement
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventDelete}
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

            <form className="calendar-form" onSubmit={handleEventCreation}>
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

              <label>Calendrier</label>
              <select
                value={newEvent.calendar_id}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, calendar_id: e.target.value }))
                }
                required
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name || (cal.entreprise_id ? "🧑‍💼 Entreprise" : "👤 Personnel")}
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
  )
}
