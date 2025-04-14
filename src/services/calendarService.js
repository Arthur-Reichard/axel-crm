// 📁 services/calendarService.js
import { supabase } from '../helper/supabaseClient';

export async function getUtilisateur(userId) {
  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id, entreprise_id")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getCalendars(utilisateur) {
  const { id: utilisateurId, entreprise_id } = utilisateur;
  let calendars = [];

  const { data: persoCal, error: err1 } = await supabase
    .from("calendars")
    .select("*")
    .eq("user_id", utilisateurId);
  if (err1) throw err1;
  if (persoCal) calendars = [...calendars, ...persoCal];

  if (entreprise_id) {
    const { data: entCal, error: err2 } = await supabase
      .from("calendars")
      .select("*")
      .eq("entreprise_id", entreprise_id);
    if (err2) throw err2;
    if (entCal) calendars = [...calendars, ...entCal];
  }

  return calendars;
}

export async function getEventsForCalendars(calendarIds) {
  const { data, error } = await supabase
    .from("events")
    .select("*, calendars(color)")
    .in("calendar_id", calendarIds);
  if (error) throw error;

  return data.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    color: e.calendars?.color || '#999'
  }));
}

export async function createEvent({ title, start_time, calendar_id }) {
  const start = new Date(start_time);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("events")
    .insert([{
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      calendar_id,
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    start: data.start_time,
    end: data.end_time,
    color: '#999'
  };
}

export async function deleteEvent(eventId) {
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw error;
}