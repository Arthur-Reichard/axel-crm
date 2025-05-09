// === Calendar.jsx responsive corrigé ===
import { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import toast, { Toaster } from 'react-hot-toast';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import QuickEventPopup from '../components/QuickEventPopup';
import EventDetailsPopup from '../components/EventDetailsPopup';



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

export default function Calendar({ darkMode }) {
  const [userId, setUserId] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', start_time: '', calendar_id: '' });
  const [eventToEdit, setEventToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const isMobile = window.innerWidth <= 900;
  const [mobileEventOverlay, setMobileEventOverlay] = useState(null);
  const [quickPopup, setQuickPopup] = useState(null);
  const [quickEventPopup, setQuickEventPopup] = useState(null);
  const [usersFromSameEntreprise, setUsersFromSameEntreprise] = useState([]);
  const [invitationsRecues, setInvitationsRecues] = useState([]);



  function createElement(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html.trim();
    return temp.firstChild;
  }


  const handleInvitationResponse = async (invitationId, statut) => {
    const { error } = await supabase
      .from('invitations_events')
      .update({ statut })
      .eq('id', invitationId);
  
    if (error) {
      toast.error("Erreur mise à jour de l'invitation");
    } else {
      toast.success(`Invitation ${statut === 'accepte' ? 'acceptée' : 'refusée'} !`);
      setInvitationsRecues(prev => prev.filter(inv => inv.id !== invitationId));
    }
  };
  
  useEffect(() => {
    const loadAll = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non connecté.");
        setUserId(user.id);

        const utilisateur = await getUtilisateur(user.id);
        let userCalendars = await getCalendars(utilisateur);

        if (utilisateur.entreprise_id) {
          const { data: congesCalendar, error: congesError } = await supabase
            .from('calendars')
            .select('*')
            .eq('entreprise_id', utilisateur.entreprise_id)
            .eq('name', 'Congés entreprise')
            .single();
        
          if (congesError) {
            console.warn('Pas de calendrier de congés trouvé ou erreur:', congesError.message);
          } else {
            // Évite les doublons si déjà dans la liste
            const alreadyIncluded = userCalendars.find(c => c.id === congesCalendar.id);
            if (!alreadyIncluded) userCalendars.push(congesCalendar);
          }
        }

        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations_events')
          .select('id, event_id, statut, events (title)')
          .eq('utilisateur_id', user.id)
          .eq('statut', 'en_attente');

        if (invitationsError) {
          console.error("Erreur récupération invitations :", invitationsError);
        } else {
          setInvitationsRecues(invitations);
        }

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

        if (utilisateur.entreprise_id) {
          const { data: users, error: usersError } = await supabase
            .from('utilisateurs')
            .select('id, prenom, nom, email')
            .eq('entreprise_id', utilisateur.entreprise_id)
            .neq('id', user.id); // pour exclure l'utilisateur lui-même
        
          if (usersError) throw usersError;
          setUsersFromSameEntreprise(users);
        }
      } catch (err) {
        toast.error("Erreur : " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const body = document.body;
    if (drawerOpen) {
      body.classList.add('drawer-open');
    } else {
      body.classList.remove('drawer-open');
    }
  }, [drawerOpen]);
  
  

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
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations_events')
        .select('id, event_id, statut, events (title)')
        .eq('utilisateur_id', user.id)
        .eq('statut', 'en_attente');

      if (invitationsError) {
        console.error("Erreur récupération invitations :", invitationsError);
      } else {
        setInvitationsRecues(invitations);
      }
    }).subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, calendars]);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

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
      console.log("Suppression ID :", quickEventPopup.event?.id);
      await deleteEvent(eventToEdit.id);
      setEvents(prev => prev.filter(ev => ev.id !== eventToEdit.id));
      setDrawerOpen(false);
      setEventToEdit(null);
      toast.success("Événement supprimé.");
    } catch (err) {
      toast.error("Erreur suppression : " + err.message);
    }
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
  };

  const handleTooltip = (info) => {
    const isMobile = window.innerWidth <= 900;
    const currentView = info.view?.type;
  
    const isTimeGrid = currentView === 'timeGridDay' || currentView === 'timeGridWeek';
  
    if (isMobile || isTimeGrid) return;
  
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

  const displayedEvents = events
  .filter(evt => selectedCalendars.includes(evt.calendar_id))
  .map(evt => {
    const cal = calendars.find(c => c.id === evt.calendar_id);
    return {
      ...evt,
      start: evt.start_time,
      end: evt.end_time,
      backgroundColor: cal?.color || '#1e88e5',
      borderColor: cal?.color || '#1e88e5',
      textColor: '#fff'
    };
  });


  if (loading) return <p className="my-calendar-app-loading">Chargement du calendrier...</p>;

  return (
    <div className={`my-calendar-app ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-right" />

      {showMobileSidebar && (
        <div
          className="my-calendar-sidebar-overlay"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <div className={`my-calendar-sidebar ${showMobileSidebar ? 'open' : ''}`}>

        <button className="my-calendar-close-menu" onClick={() => setShowMobileSidebar(false)}>×</button>

        <div className="my-calendar-create-wrapper">
          <button className="my-calendar-create-btn" onClick={() => setDrawerOpen(true)}>
            <span>＋</span> Créer un événement
          </button>
        </div>

        <div className="my-calendar-mini">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
          height="100%"
          contentHeight="auto"
          fixedWeekCount={false}
          dayMaxEventRows={1}
          selectable
          datesSet={(arg) => setCurrentDate(arg.view.currentStart)}
          select={(arg) => {
            const isMobile = window.innerWidth <= 900;
          
            if (isMobile) {
              calendarRef.current?.getApi().changeView('timeGridDay', arg.start);
              setCurrentView('timeGridDay');
              return;
            }
          
            const start = new Date(arg.start);
            const end = new Date(arg.end);
            const duration = Math.round((end - start) / (1000 * 60)); // durée en minutes
          
            const startStr = start.toISOString().slice(0, 16); // ex: '2025-04-17T09:00'
          
            setNewEvent({
              title: '',
              start_time: startStr,
              calendar_id: calendars[0]?.id || '',
              description: '',
              lieu: '',
              duration: duration || 60
            });
          
            setDrawerOpen(true);
          }}
                          
          />
      </div>


      <div className="mobile-view-buttons">
        <button
          className={currentView === 'dayGridMonth' ? 'active' : ''}
          onClick={() => {
            setCurrentView('dayGridMonth');
            calendarRef.current?.getApi().changeView('dayGridMonth');
          }}
        >
          Mois
        </button>
        <button
          className={currentView === 'timeGridWeek' ? 'active' : ''}
          onClick={() => {
            setCurrentView('timeGridWeek');
            calendarRef.current?.getApi().changeView('timeGridWeek');
          }}
        >
          Semaine
        </button>
        <button
          className={currentView === 'timeGridDay' ? 'active' : ''}
          onClick={() => {
            setCurrentView('timeGridDay');
            calendarRef.current?.getApi().changeView('timeGridDay');
          }}
        >
          Jour
        </button>
        <button
          className={currentView === 'listWeek' ? 'active' : ''}
          onClick={() => {
            setCurrentView('listWeek');
            const api = calendarRef.current?.getApi();
            if (api) {
              api.changeView('listWeek', new Date()); // 👈 focus sur aujourd’hui
            }
          }}
        >
          Liste
        </button>

      </div>



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

        {invitationsRecues.length > 0 && (
          <div className="invitations-sidebar-section">
            <h4>Invitations reçues</h4>
            <ul className="invitation-list">
              {invitationsRecues.map(invite => (
                <li key={invite.id} className="invitation-item">
                  <span>{invite.events?.title || 'Événement'}</span>
                  <div className="invitation-actions">
                    <button onClick={() => handleInvitationResponse(invite.id, 'accepte')}>✅</button>
                    <button onClick={() => handleInvitationResponse(invite.id, 'refuse')}>❌</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="my-calendar-main">
        <div className={`my-calendar-header-mobile ${currentView === 'listWeek' ? 'no-arrows' : ''}`}>
        <button
          className={`my-calendar-hamburger ${showMobileSidebar ? 'invisible' : ''}`}
          onClick={() => setShowMobileSidebar(true)}
        >
          ☰
        </button>
          <button className="prev" onClick={() => calendarRef.current?.getApi().prev()}>←</button>
          <div className="my-calendar-current-month">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </div>
          <button className="next" onClick={() => calendarRef.current?.getApi().next()}>→</button>
        </div>



        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          ref={calendarRef}
          editable
          selectable
          eventResizableFromStart
          events={displayedEvents}
          eventClick={async (info) => {
            const isMobile = window.innerWidth <= 900;
            const clickedEvent = events.find(e => e.id === info.event.id);
            if (!clickedEvent) return;
          
            // Debug avec log
            const { data: invites, error } = await supabase
              .from('invitations_events')
              .select('id, statut, utilisateur:utilisateur_id (prenom, nom, email)')
              .eq('event_id', clickedEvent.id);
          
            if (error) {
              console.error("❌ Supabase error on invite fetch:", error);
              toast.error("Erreur chargement des invités");
              return;
            }
          
            console.log("✅ Invités récupérés :", invites);
          
            const enrichedEvent = { ...clickedEvent, invites };
          
            if (isMobile && (currentView === 'timeGridWeek' || currentView === 'timeGridDay')) {
              setMobileEventOverlay(enrichedEvent);
            } else {
              setQuickPopup(null);
              setTimeout(() => {
                setQuickEventPopup({
                  x: info.jsEvent.pageX,
                  y: info.jsEvent.pageY,
                  event: enrichedEvent
                });
              }, 20);
            }
          }}          
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          dateClick={(arg) => {
            if (isMobile) {
              calendarRef.current?.getApi().changeView('timeGridDay', arg.date);
              setCurrentView('timeGridDay');
            } else {
              const x = arg.jsEvent.pageX;
              const y = arg.jsEvent.pageY;
              setQuickPopup({ x, y, date: arg.dateStr });
            }
          }}                   
          eventDidMount={handleTooltip}
          datesSet={(arg) => setCurrentDate(arg.view.currentStart)}
          height="calc(var(--vh, 1vh) * 100)"
          headerToolbar={window.innerWidth > 900 ? {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          } : {
            left: '',
            center: '',
            right: ''
          }}
          buttonText={{
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste'
          }}
          viewDidMount={(arg) => {
            setCurrentView(arg.view.type);
          }}
          eventStartEditable={true}
          eventDurationEditable={true}
          longPressDelay={isMobile ? 400 : 0}
          eventLongPressDelay={isMobile ? 400 : 0}
          dragScroll={isMobile}
          eventContent={(arg) => {
            const view = arg.view.type;
            const isTimeGrid = view === 'timeGridDay' || view === 'timeGridWeek';
            const isMonth = view === 'dayGridMonth';
            const isMobile = window.innerWidth <= 900;
            
            const title = arg.event.title;
            const start = arg.event.start;
            const hours = start.getHours().toString().padStart(2, '0');
            const minutes = start.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            const color = arg.event.backgroundColor || arg.event.color || '#1e88e5';

            if (isTimeGrid) {
              const lieu = arg.event.extendedProps.lieu;
              const description = arg.event.extendedProps.description;
              const duration = arg.event.extendedProps.duration;
          
              return {
                domNodes: [createElement(`
                  <div style="
                    background-color: ${color};
                    border: 1px solid ${color};
                    color: white;
                    border-radius: 6px;
                    padding: 6px 8px;
                    font-size: 0.8rem;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-sizing: border-box;
                    overflow: hidden;
                    gap: 2px;
                  ">
                    <div style="font-weight: bold;">${title}</div>
                    ${lieu ? `<div style="font-size: 0.75rem;">📍 ${lieu}</div>` : ''}
                    ${description ? `<div style="font-size: 0.75rem; opacity: 0.85;">${description}</div>` : ''}
                    ${duration ? `<div style="font-size: 0.75rem;">⏱ ${duration} min</div>` : ''}
                  </div>
                `)]
              };
            }
          
            return {
              domNodes: [createElement(`
                <div style="
                  background-color: ${color};
                  border: 1px solid ${color};
                  color: white;
                  border-radius: 6px;
                  padding: 2px 6px;
                  font-size: 0.8rem;
                  display: block;
                  width: 100%;
                  box-sizing: border-box;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  <strong>${title}</strong>
                </div>
              `)]
            };

          }}                   
        />
      </div>

      {mobileEventOverlay && (
        <div className="my-calendar-event-overlay">
          <div className="my-calendar-event-overlay-header">
            <button onClick={() => setMobileEventOverlay(null)}>×</button>
            <span>Détails</span>
            <button onClick={() => {
              setEventToEdit(event);
              setQuickEventPopup(null);
              setDrawerOpen(true);
            }}>✎ Modifier</button>
          </div>

          <div className="my-calendar-event-overlay-content">
            <h2>{mobileEventOverlay.title}</h2>
            {mobileEventOverlay.lieu && <p>📍 {mobileEventOverlay.lieu}</p>}
            {mobileEventOverlay.description && <p>{mobileEventOverlay.description}</p>}
            {mobileEventOverlay.start_time && <p>🕒 {new Date(mobileEventOverlay.start_time).toLocaleString()}</p>}
            {mobileEventOverlay.duration && <p>⏱ {mobileEventOverlay.duration} minutes</p>}
          </div>
        </div>
      )}

      {(quickPopup || quickEventPopup) && (
        <div className="popup-overlay" />
      )}


      {quickPopup && !quickPopup.event && (
        <QuickEventPopup
          utilisateursEntreprise={usersFromSameEntreprise}
          x={quickPopup.x}
          y={quickPopup.y}
          date={quickPopup.date}
          calendars={calendars}
          onClose={() => setQuickPopup(null)}
          onSave={async (data) => {
            try {
              // 1. Créer l'événement principal
              const newEvt = await createEvent(data);
              setEvents(prev => [...prev, newEvt]);
          
              // 2. Insérer les invitations
              if (data.invites && data.invites.length > 0) {
                const invitesToInsert = data.invites.map(uid => ({
                  event_id: newEvt.id,
                  utilisateur_id: uid,
                  invite_par: userId,
                  statut: 'en_attente'
                }));
          
                const { error: inviteError } = await supabase
                  .from('invitations_events')
                  .insert(invitesToInsert);
          
                if (inviteError) {
                  console.error('Erreur insert invitations:', inviteError);
                  toast.error("Invitations non envoyées");
                }
              }
          
              toast.success("Événement + invitations envoyés !");
              setQuickPopup(null);
            } catch (err) {
              toast.error("Erreur : " + err.message);
            }
          }}          
          onMoreOptions={(evtData) => {
            setNewEvent({
              ...evtData,
              duration: evtData.duration ?? 60
            });
            setDrawerOpen(true);
            setQuickPopup(null);
          }}
        />
      )}


      {quickEventPopup && (
        <EventDetailsPopup
          x={quickEventPopup.x}
          y={quickEventPopup.y}
          event={quickEventPopup.event}
          calendars={calendars}
          onClose={() => setQuickEventPopup(null)}
          onUpdate={async (updatedData) => {
            try {
              const result = await updateEvent(updatedData);
              setEvents(prev => prev.map(ev => ev.id === result.id ? result : ev));
              toast.success("Événement modifié !");
              setQuickEventPopup(null);
            } catch (err) {
              toast.error("Erreur modification : " + err.message);
            }
          }}
          onDelete={async () => {
            const event = quickEventPopup?.event;
            const eventId = event?.id;
          
            console.log("🧪 Suppression demandée pour :", event);
            console.log("🧪 ID transmis :", eventId);
          
            if (!eventId) {
              toast.error("Événement introuvable pour suppression.");
              return;
            }
          
            try {
              await deleteEvent(eventId);
              toast.success("Événement supprimé !");
          
              const calendarIds = calendars.map(c => c.id);
              const refreshed = await getEventsForCalendars(calendarIds);
              setEvents(refreshed);
          
            } catch (err) {
              toast.error("Erreur suppression : " + err.message);
            } finally {
              setQuickEventPopup(null);
            }
          }}                 
        />
      )}
    </div>
  );
}