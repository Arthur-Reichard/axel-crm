import { useEffect, useState, useMemo } from "react";
import { supabase } from "../helper/supabaseClient";
import MiniCalendar from './MiniCalendar';
import QuickEventPopup from './QuickEventPopup';
import './css/EmployeeDetail.css';
import { VscHome, VscMail, VscCallOutgoing, VscSettingsGear, VscSave } from "react-icons/vsc";

export default function EmployeeDetail({ employee, onSaved, onDeleted }) {
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [utilisateur, setUtilisateur] = useState(null);
  const [poste, setPoste] = useState('');
  const [notePerso, setNotePerso] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 200, y: 300 });
  const [services, setServices] = useState([]);
  const [bannerUrl, setBannerUrl] = useState("https://source.unsplash.com/1200x300/?nature,landscape");
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const { data: userSession } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', userSession.user.id)
        .single();

      if (!error) {
        setCurrentUserRole(data.role);
      }
    };

    fetchCurrentUserRole();
  }, []);

  useEffect(() => {
    setForm(employee);
    setEditMode(false);
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
          onSaved?.();
        }
      }
    };

    ensureCalendar();
  }, [form]);

  useEffect(() => {
    const fetchUtilisateur = async () => {
      if (!employee?.id) return;
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('email, phone, birthdate, adresse, service_id, avatar_url, banner_url, entreprise_id, role')
        .eq('id', employee.id)
        .single();

      if (!error) {
        setUtilisateur(data);
      }
    };

    fetchUtilisateur();
  }, [employee]);

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

  useEffect(() => {
    const fetchServices = async () => {
      if (!utilisateur?.entreprise_id) return;
      const { data, error } = await supabase
        .from("services")
        .select("id, nom, parent_id")
        .eq("entreprise_id", utilisateur.entreprise_id);

      if (!error && data) {
        setServices(data);
      }
    };

    fetchServices();
  }, [utilisateur]);

  useEffect(() => {
    const fetchNotePerso = async () => {
      if (!employee?.id) return;

      const user = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("notes_employes")
        .select("note")
        .eq("cible_id", employee.id)
        .eq("auteur_id", user.data.user.id) // 👈 important
        .maybeSingle(); // ✅ au lieu de .single()

      if (!error && data?.note) {
        setNotePerso(data.note);
      } else {
        setNotePerso('');
      }
    };

    fetchNotePerso();
  }, [employee]);

  useEffect(() => {
    if (utilisateur?.banner_url) {
      setBannerUrl(utilisateur.banner_url);
    } else {
      setBannerUrl("https://source.unsplash.com/1200x300/?nature,landscape");
    }
  }, [utilisateur]);

  const flatServiceList = useMemo(() => {
    const buildTree = (list, parentId = null) =>
      list
        .filter(s => s.parent_id === parentId)
        .map(s => ({
          ...s,
          children: buildTree(list, s.id),
        }));

    const buildFlatList = (nodes, level = 0) =>
      nodes.flatMap(node => {
        const prefix = "— ".repeat(level);
        const entry = { id: node.id, label: prefix + node.nom };
        const children = buildFlatList(node.children || [], level + 1);
        return [entry, ...children];
      });

    return buildFlatList(buildTree(services));
  }, [services]);

  const handleChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form) return;

    const user = await supabase.auth.getUser();
    await supabase
      .from("notes_employes")
      .upsert({
        auteur_id: user.data.user.id,
        cible_id: form.id,
        note: notePerso
      }, { onConflict: ['auteur_id', 'cible_id'] });

    onSaved?.();
    setEditMode(false);
  };

  const handleDelete = async () => {
    if (!form?.id) return;
    const { error } = await supabase.from('employes').delete().eq('id', form.id);
    if (!error && onDeleted) onDeleted();
  };

  if (!form) return <div className="employee-detail" style={{padding : '1.5rem'}}>Sélectionnez un employé</div>;

  const avatarUrl = form?.photo_url ?? utilisateur?.avatar_url ?? null;

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
          {utilisateur?.adresse && <><VscHome className="icon" /><span>{utilisateur.adresse}</span></>}
          {utilisateur?.email && <><VscMail className="icon" /><span>{utilisateur.email}</span></>}
          {utilisateur?.phone && <><VscCallOutgoing className="icon" /><span>{utilisateur.phone}</span></>}
        </div>
      </div>

      <button
        className="edit-button"
        onClick={() => {
          if (editMode) handleSave();
          setEditMode(prev => !prev);
        }}
      >
        {editMode ? <VscSave /> : <VscSettingsGear />}
      </button>

      <div className="form-grid">
        <div className="field">
          <label>Date de naissance</label>
          <input type="date" value={utilisateur?.birthdate || ''} readOnly />
        </div>

        <div className="field">
          <label>Poste</label>
          {editMode ? (
            <select
              name="service_id"
              value={String(utilisateur?.service_id || '')}
              onChange={async (e) => {
                const serviceId = e.target.value;
                const selected = services.find(s => s.id === serviceId);
                setPoste(selected?.nom || '');
                await supabase.from("utilisateurs").update({ service_id: serviceId }).eq("id", form.id);
                setUtilisateur(prev => ({ ...prev, service_id: serviceId }));
              }}
            >
              <option value="">Aucun</option>
              {flatServiceList.map(s => (
                <option key={s.id} value={String(s.id)}>{s.label}</option>
              ))}
            </select>
          ) : (
            <input value={poste} readOnly />
          )}
        </div>

        {currentUserRole === 'admin' && (
          <div className="field">
            <label>Rôle</label>
            {editMode ? (
              <select
                value={utilisateur?.role || 'membre'}
                onChange={async (e) => {
                  const newRole = e.target.value;
                  await supabase
                    .from("utilisateurs")
                    .update({ role: newRole })
                    .eq("id", form.id);

                  setUtilisateur(prev => ({ ...prev, role: newRole }));
                }}
              >
                <option value="membre">Membre</option>
                <option value="admin">Admin</option>
                <option value="invité">Invité</option>
              </select>
            ) : (
              <input value={utilisateur?.role || 'membre'} readOnly />
            )}
          </div>
        )}

      </div>
      <div className="form-grid-full">
        <div className="field full-width">
          <label>Note personnelle (privée)</label>
          <textarea
            rows="3"
            value={notePerso}
            onChange={(e) => setNotePerso(e.target.value)}
            readOnly={!editMode}
            placeholder="Votre note privée sur cette personne..."
          />
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