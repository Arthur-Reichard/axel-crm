import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import supabase from '../helper/supabaseClient'
import './css/Calendar.css'

export default function Calendar({ userId }) {
  const [calendars, setCalendars] = useState([])
  const [events, setEvents] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', start_time: '' })

  useEffect(() => {
    if (userId) {
      console.log("userId reçu :", userId)
      fetchCalendars()
    }
  }, [userId])
  

  useEffect(() => {
    if (calendars.length > 0) fetchEvents(calendars[0].id)
  }, [calendars])

  const fetchCalendars = async () => {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', userId)
  
    if (error) {
      console.error("Erreur lors de la récupération des calendriers :", error)
      return
    }
  
    if (data.length === 0) {
      const { data: newCal, error: createError } = await supabase
        .from("calendars")
        .insert([{
          name: "Mon calendrier",
          user_id: userId,
          source: "local",
          color: "#B6052E"
        }])
        .select()
        .single()
  
      if (createError) {
        console.error("Erreur création calendrier :", createError)
        return
      }
  
      setCalendars([newCal]) // ✅ on remplit manuellement le state
    } else {
      setCalendars(data)
    }
  }
  

  const fetchEvents = async (calendarId) => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('calendar_id', calendarId)

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

  const handleEventCreation = async (e) => {
    e.preventDefault()

    console.log("Nouvel événement :", newEvent)
    console.log("Calendars[0] :", calendars[0])

    const { title, start_time } = newEvent

    if (!title.trim()) {
      alert("Merci d'indiquer un titre.")
      return
    }

    if (!start_time) {
      alert("Merci de choisir une date et une heure.")
      return
    }

    if (!calendars.length || !calendars[0]?.id) {
      alert("Aucun calendrier disponible.")
      return
    }

    const start = new Date(start_time)
    if (isNaN(start.getTime())) {
      alert("Date invalide.")
      return
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000)

    const { data: insertedEvent, error } = await supabase
      .from("events")
      .insert([{
        title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        calendar_id: calendars[0].id,
      }])
      .select()
      .single()

    if (error) {
      alert("Erreur lors de la création : " + error.message)
      return
    }

    setEvents((prev) => [...prev, {
      id: insertedEvent.id,
      title: insertedEvent.title,
      start: insertedEvent.start_time,
      end: insertedEvent.end_time
    }])

    setNewEvent({ title: '', start_time: '' })
    setDrawerOpen(false)
  }

  const handleEventDelete = async (clickInfo) => {
    if (confirm(`Supprimer "${clickInfo.event.title}" ?`)) {
      await supabase.from('events').delete().eq('id', clickInfo.event.id)
      fetchEvents(calendars[0].id)
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Mon calendrier</h1>
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
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                required
              />
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
