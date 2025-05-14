import { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import MiniCalendar from './MiniCalendar';
import QuickEventPopup from './QuickEventPopup';
import './css/EmployeeDetail.css';
import { VscHome, VscMail, VscCallOutgoing } from "react-icons/vsc";

export default function EmployeeDetail({ employee, onSaved, onDeleted }) {
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [utilisateur, setUtilisateur] = useState(null);
  const [poste, setPoste] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 200, y: 300 });

  // Met à jour le formulaire quand l'employé change
  useEffect(() => {
    setForm(employee);
    setEditMode(false);
    console.log("🧩 Nouvel employé reçu :", employee);
  }, [employee]);

  // Crée un calendrier si besoin
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
          onSaved?.();
        }
      }
    };

    ensureCalendar();
  }, [form]);

  // Récupère l'utilisateur lié
  useEffect(() => {
    const fetchUtilisateur = async () => {
      if (!employee?.id) return;
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('email, phone, birthdate, adresse, service_id, avatar_url, banner_url')
        .eq('id', employee.id)
        .single();

      if (!error) {
        console.log("🔗 Données utilisateur liées :", data);
        setUtilisateur(data);
      }
    };

    fetchUtilisateur();
  }, [employee]);

  // Récupère le nom du service (poste)
  useEffect(() => {
    const fetchService = async () => {
      if (!utilisateur?.service_id) return;

      const { data, error } = await supabase
        .from('services')
        .select('nom')
        .eq('id', utilisateur.service_id)
        .single();

      if (!error && data?.nom) {
        setPoste(data.nom);
      }
    };

    fetchService();
  }, [utilisateur]);

  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const defaultBanner = "https://source.unsplash.com/1200x300/?nature,landscape";
  const avatarUrl = form?.photo_url ?? utilisateur?.avatar_url ?? null;
    const [bannerUrl, setBannerUrl] = useState(defaultBanner);

useEffect(() => {
  if (utilisateur?.banner_url) {
    setBannerUrl(utilisateur.banner_url);
  } else {
    setBannerUrl(defaultBanner);
  }
}, [utilisateur]);


  if (!form) return <div className="employee-detail" style={{padding : '1.5rem'}}>Sélectionnez un employé</div>;

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

  return (
    <div className="employee-detail">
      <div
  className="employee-banner"
  style={{
    backgroundImage: `url(${bannerUrl})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
        <div className="employee-banner-overlay">
          {avatarUrl ? (
            <img className="employee-avatar" src={avatarUrl} alt="avatar" />
          ) : (
            <div className="employee-avatar initials">
              {(form.prenom?.[0] || '').toUpperCase()}
              {(form.nom?.[0] || '').toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="employee-info">
        <h2>{form.prenom} {form.nom}</h2>
        <p>{poste}</p>
<div className="employee-infos-details">
  {utilisateur?.adresse && (
    <>
      <VscHome className="icon" />
      <span>{utilisateur.adresse}</span>
    </>
  )}
  {utilisateur?.email && (
    <>
      <VscMail className="icon" />
      <span>{utilisateur.email}</span>
    </>
  )}
    {utilisateur?.phone && (
    <>
      <VscCallOutgoing className="icon" />
      <span>{utilisateur.phone}</span>
    </>
  )}
</div>

      </div>

      <div className="form-grid">
        <div className="field">
          <label>Date de naissance</label>
          <input type="date" value={utilisateur?.birthdate || ''} readOnly />
        </div>
        <div className="field">
          <label>Poste</label>
          <input value={poste} readOnly />
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
          date={new Date()}
          calendars={[{ id: form.calendar_id, name: 'Calendrier employé' }]}
          utilisateursEntreprise={[{
            id: form.id,
            prenom: form.prenom,
            nom: form.nom,
            email: form.email
          }]}
          onClose={() => setShowPopup(false)}
          onSave={(data) => {
            console.log('Event à créer pour cet employé :', data);
            setShowPopup(false);
          }}
          onMoreOptions={() => {}}
        />
      )}
    </div>
  );
}