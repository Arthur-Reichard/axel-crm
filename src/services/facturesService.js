import { supabase } from "../helper/supabaseClient";

export async function fetchFactures() {
  const { data, error } = await supabase
    .from("factures")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFacture(factureData) {
  const { data, error } = await supabase
    .from("factures")
    .insert([factureData])
    .select()
    .single();
  if (error) throw error;
  return data;
}
