import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { supabase } from '../helper/supabaseClient';

export default function MiniCalendar({ calendarId, fallback = true }) {
  const [events, setEvents] = useState([]);
  const [fakeMode, setFakeMode] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!calendarId) {
        if (fallback) {
          // Affiche un calendrier vide avec un événement fictif
          setEvents([
            {
              title: "Aucun calendrier lié",
              start: new Date().toISOString(),
              end: new Date().toISOString()
            }
          ]);
          setFakeMode(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_time, end_time')
        .eq('calendar_id', calendarId);

      if (!error && data) {
        setEvents(data.map(evt => ({
          id: evt.id,
          title: evt.title,
          start: evt.start_time,
          end: evt.end_time
        })));
      }
    };

    fetchEvents();
  }, [calendarId]);

  return (
    <div className="mini-employee-calendar">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        height="auto"
        events={events}
        headerToolbar={{
          left: '',
          center: 'title',
          right: ''
        }}
      />
      {fakeMode && <p style={{ textAlign: 'center', marginTop: '1rem', opacity: 0.6 }}>Aucun calendrier associé</p>}
    </div>
  );
}
