import { supabase } from '../helper/supabaseClient';

// 🔍 Récupérer tous les matériels de l'entreprise courante
export const getMaterielsByEntreprise = async (entrepriseId) => {
  const { data, error } = await supabase
    .from('materiels')
    .select('*')
    .eq('entreprise_id', entrepriseId)
    .order('cree_le', { ascending: false });

  if (error) throw error;
  return data;
};

// ➕ Ajouter un nouveau matériel
export const createMateriel = async (materielData) => {
  const { data, error } = await supabase
    .from('materiels')
    .insert([materielData])
    .select();

  if (error) throw error;
  return data[0];
};

// ✏️ Modifier un matériel
export const updateMateriel = async (id, updates) => {
  const { data, error } = await supabase
    .from('materiels')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

// 🗑 Supprimer un matériel
export const deleteMateriel = async (id) => {
  const { error } = await supabase
    .from('materiels')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
