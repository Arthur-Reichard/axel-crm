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
    if (userId) fetchCalendars()
  }, [userId])

  useEffect(() => {
    if (calendars.length > 0) fetchEvents(calendars[0].id)
  }, [calendars])

  const fetchCalendars = async () => {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('user_id', userId)

    if (!error && data) setCalendars(data)
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

  const createEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.start_time || !calendars[0]) return

    const start = new Date(newEvent.start_time)
    const end = new Date(start.getTime() + 60 * 60 * 1000)

    const { error } = await supabase.from('events').insert([{
      title: newEvent.title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      calendar_id: calendars[0].id,
    }])

    if (!error) {
      setNewEvent({ title: '', start_time: '' })
      setDrawerOpen(false)
      fetchEvents(calendars[0].id)
    }
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

            <form className="calendar-form" onSubmit={createEvent}>
              <label>Titre</label>
              <input
                type="text"
                placeholder="Nom de l’événement"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
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