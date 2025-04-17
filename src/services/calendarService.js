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

  return data.map((e) => {
    const fixedId = e.id ?? e.fid ?? e.uuid;
    console.log("→ Event brut Supabase :", e);
    console.log("✅ ID utilisé :", fixedId);

    return {
      id: fixedId,
      title: e.title,
      start_time: e.start_time,
      end_time: e.end_time,
      calendar_id: e.calendar_id,
      description: e.description,
      lieu: e.lieu,
      duration: e.duration,
      color: e.calendars?.color || '#999'
    };
  });
}

export async function createEvent({ title, start_time, calendar_id, description, lieu, duration = 60, recurrence = 'none', recurrence_end_date }) {
  const start = new Date(start_time);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const { data, error } = await supabase
    .from("events")
    .insert([{
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      calendar_id,
      description,
      lieu,
      duration,
      recurrence,
      recurrence_end_date: recurrence !== 'none' ? recurrence_end_date : null,
      is_recurring: recurrence !== 'none'
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    color: '#999'
  };
}

export async function updateEvent(event) {
  const { id, title, start_time, calendar_id, description, lieu, duration = 60 } = event;
  const startDate = new Date(start_time);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const updateData = {
    title: String(title),
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    calendar_id: String(calendar_id),
    description,
    lieu,
    duration
  };

  const { data, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    start_time: data.start_time,
    end_time: data.end_time,
    calendar_id: data.calendar_id,
    description: data.description,
    lieu: data.lieu,
    duration: data.duration,
    color: '#999'
  };
}

export async function deleteEvent(eventId) {
  const cleanedId = String(eventId).trim();

  console.log("🗑️ Tentative de suppression Supabase pour l'ID :", cleanedId);
  console.log("Type:", typeof cleanedId, "Longueur:", cleanedId.length);

  const { data, error } = await supabase
    .from("events")
    .delete()
    .eq("id", cleanedId)
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Aucune ligne supprimée.");
  } else {
  }
}

export async function updateEventTime({ id, start_time, end_time }) {
  const start = new Date(start_time);
  const end = new Date(end_time);

  const { data, error } = await supabase
    .from("events")
    .update({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    start_time: data.start_time,
    end_time: data.end_time,
    calendar_id: data.calendar_id,
    color: '#999'
  };
}