import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import MiniCalendar from '../components/MiniCalendar';
import QuickEventPopup from './QuickEventPopup';

export default function EmployeeDetail({ employee, onSaved, onDeleted }) {
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setForm(employee);
    setEditMode(false); // ← remet en lecture seule à chaque changement d'employé
  }, [employee]);

  useEffect(() => {
    const ensureCalendar = async () => {
      if (!form?.calendar_id && form?.id && form?.entreprise_id) {
        const { data, error } = await supabase
          .from("calendars")
          .insert([
            {
              name: `Calendrier - ${form.prenom} ${form.nom}`,
              entreprise_id: form.entreprise_id,
              color: "#14b8a6"
            }
          ])
          .select()
          .single();
  
        if (!error && data) {
          await supabase
            .from("employes")
            .update({ calendar_id: data.id })
            .eq("id", form.id);
  
          setForm(prev => ({ ...prev, calendar_id: data.id }));
          onSaved?.(); // force le refresh du drawer si nécessaire
        }
      }
    };
  
    ensureCalendar();
  }, [form]);

  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form) return;
    const { error } = await supabase.from('employes').update(form).eq('id', form.id);
    if (!error && onSaved) onSaved();
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!form?.id) return;
    const { error } = await supabase.from('employes').delete().eq('id', form.id);
    if (!error && onDeleted) onDeleted();
  };

  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 200, y: 300 });
  

  if (!form) return <div className="employee-detail">Sélectionnez un employé</div>;

  return (
    <div className="employee-detail">
  <div className="header">
    <div className="avatar-zone">
      {form.photo_url ? (
        <img src={form.photo_url} className="avatar-preview" />
      ) : (
        <div className="avatar-placeholder">?</div>
      )}
      {editMode && (
        <input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const filePath = `avatars/${form.id}-${file.name}`;
          const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
          if (!error) {
            const url = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;
            const updated = { ...form, photo_url: url };
            setForm(updated);
            onSaved?.(); // update le drawer
          }
        }} />
      )}
    </div>

    <div className="title-zone">
      <h2>{form.prenom || ''} {form.nom || ''}</h2>
    </div>

    <div className="button-zone">
      {!editMode ? (
        <button className="edit" onClick={() => setEditMode(true)}>✏️</button>
      ) : (
        <>
          <button className="edit" onClick={handleSave}>💾</button>
          <button className="cancel" onClick={() => setEditMode(false)}>✖</button>
        </>
      )}
      <button className="delete" onClick={handleDelete}>🗑️</button>
    </div>
  </div>

  <div className="form-grid">
    <div className="field">
      <label>Prénom</label>
      <input name="prenom" value={form.prenom || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Nom</label>
      <input name="nom" value={form.nom || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Email</label>
      <input name="email" value={form.email || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Téléphone</label>
      <input name="telephone" value={form.telephone || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Poste</label>
      <input name="poste" value={form.poste || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Date de naissance</label>
      <input type="date" name="date_naissance" value={form.date_naissance || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
    <div className="field">
      <label>Adresse</label>
      <input name="adresse" value={form.adresse || ''} onChange={handleChange} readOnly={!editMode} />
    </div>

    <div className="field full-width">
      <label>Notes</label>
      <textarea name="notes" rows="3" value={form.notes || ''} onChange={handleChange} readOnly={!editMode} />
    </div>
  </div>
  <MiniCalendar calendarId={form?.calendar_id} fallback={true} />

  <button
  className="add-event-employee"
  onClick={(e) => {
    const rect = e.target.getBoundingClientRect();
    setPopupPosition({ x: rect.x, y: rect.y });
    setShowPopup(true);
  }}
>
  + Ajouter un événement
</button>
{showPopup && (
  <QuickEventPopup
    x={popupPosition.x}
    y={popupPosition.y}
    date={new Date()} // ou tu peux prendre la date sélectionnée dans le calendrier si tu veux
    calendars={[{ id: form.calendar_id, name: 'Calendrier employé' }]}
    utilisateursEntreprise={[{ id: form.id, prenom: form.prenom, nom: form.nom, email: form.email }]} // associe l’employé en tant qu'invité
    onClose={() => setShowPopup(false)}
    onSave={(data) => {
      console.log('Event à créer pour cet employé :', data);
      // Tu peux appeler ici ta fonction pour insérer en base (ou passer un prop onEventCreated)
      setShowPopup(false);
    }}
    onMoreOptions={() => {}}
  />
)}
    </div>
  );
}

