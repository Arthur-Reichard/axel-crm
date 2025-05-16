import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "../helper/SupabaseClient";
import './css/Reunion.css';
import DashboardNavbar from "./DashboardNavbar";
import ChampsSettingsDrawer from '../components/ChampsSettingsDrawer';
import { FiChevronDown, FiSettings } from 'react-icons/fi';

const ReunionDetail = () => {
  const { id } = useParams();
  const [reunion, setReunion] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [champVisibles, setChampVisibles] = useState([]);
  const [userId, setUserId] = useState(null);

  const champsParDefaut = [
    'titre', 'date_reunion', 'heure_debut', 'heure_fin', 'lieu',
    'participants', 'objectifs', 'ordre_du_jour',
    'contenu', 'decisions', 'taches', 'commentaires'
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchChamps = async () => {
      const { data: existants, error } = await supabase
        .from('champs_reunion')
        .select('*')
        .eq('utilisateur_id', userId);

      if (error) return;

      if ((existants || []).length < champsParDefaut.length) {
        const existantsSet = new Set(existants.map(c => c.nom_champ));
        const manquants = champsParDefaut.filter(c => !existantsSet.has(c));
        const inserts = manquants.map(c => ({
          utilisateur_id: userId,
          nom_champ: c,
          visible: true
        }));

        if (inserts.length > 0) {
          await supabase.from('champs_reunion').insert(inserts);
        }

        const { data: nouveaux } = await supabase
          .from('champs_reunion')
          .select('*')
          .eq('utilisateur_id', userId);

        setChampVisibles(nouveaux || []);
      } else {
        setChampVisibles(existants);
      }
    };

    if (userId) fetchChamps();
  }, [userId]);

  useEffect(() => {
    const fetchReunion = async () => {
      const { data, error } = await supabase
        .from('comptes_rendus_reunion')
        .select('*')
        .eq('id', id)
        .single();

      if (!error) {
        setReunion(data);
        setEditForm(data);
      }
    };

    fetchReunion();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleListChange = (field, index, value) => {
    const updated = [...editForm[field]];
    updated[index] = value;
    setEditForm(prev => ({ ...prev, [field]: updated }));
  };

  const handleAddItem = (field) => {
    const defaultValue = field === 'participants'
      ? { nom: '', fonction: '' }
      : '';

    setEditForm(prev => ({ ...prev, [field]: [...(prev[field] || []), defaultValue] }));
  };

  const handleRemoveItem = (field, index) => {
    const updated = [...editForm[field]];
    updated.splice(index, 1);
    setEditForm(prev => ({ ...prev, [field]: updated }));
  };

  const saveChanges = async () => {
    const { error } = await supabase
      .from('comptes_rendus_reunion')
      .update(editForm)
      .eq('id', id);

    if (!error) {
      setReunion(editForm);
      setEditMode(false);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } else {
      alert("Erreur lors de l'enregistrement ❌");
    }
  };

  if (!reunion || !editForm) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <>
      <DashboardNavbar />

      <button className="reunion-retour-btn" onClick={() => window.history.back()}>
        ← Retour
      </button>

      {toast && <div className="toast-success">✅ Modifications enregistrées</div>}

      <div className="reunion-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editMode ? (
            <input
              name="titre"
              value={editForm.titre || ''}
              onChange={handleChange}
              style={{ fontSize: '1.8rem', fontWeight: 'bold', width: '100%' }}
            />
          ) : (
            <h1>{reunion.titre || 'Sans titre'}</h1>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setEditMode(!editMode)} className="edit-btn">
              {editMode ? 'Annuler' : 'Modifier'}
            </button>
          </div>
        </div>

        <div className="reunion-detail-header">
          <div className="reunion-card">
            <p><strong>Date :</strong> {editMode ? (
              <input type="date" name="date_reunion" value={editForm.date_reunion || ''} onChange={handleChange} />
            ) : (
              reunion.date_reunion
            )}</p>
            <p><strong>Heure :</strong> {editMode ? (
              <>
                <input type="time" name="heure_debut" value={editForm.heure_debut || ''} onChange={handleChange} />
                {' → '}
                <input type="time" name="heure_fin" value={editForm.heure_fin || ''} onChange={handleChange} />
              </>
            ) : (
              `${reunion.heure_debut || '—'} → ${reunion.heure_fin || '—'}`
            )}</p>
            <p><strong>Lieu :</strong> {editMode ? (
              <input name="lieu" value={editForm.lieu || ''} onChange={handleChange} />
            ) : (
              reunion.lieu || '—'
            )}</p>
          </div>

          <div className="reunion-card">
            <h3 className="card-title">Participants</h3>
            {editMode ? (
              <>
                <ul>
                  {editForm.participants?.map((p, i) => (
                    <li key={i}>
                      <input
                        type="text"
                        value={p.nom || ''}
                        onChange={(e) => {
                          const updated = [...editForm.participants];
                          updated[i].nom = e.target.value;
                          setEditForm(prev => ({ ...prev, participants: updated }));
                        }}
                        placeholder="Nom"
                      />
                      <input
                        type="text"
                        value={p.fonction || ''}
                        onChange={(e) => {
                          const updated = [...editForm.participants];
                          updated[i].fonction = e.target.value;
                          setEditForm(prev => ({ ...prev, participants: updated }));
                        }}
                        placeholder="Fonction"
                      />
                      <button onClick={() => handleRemoveItem('participants', i)} style={{ marginLeft: '0.5rem' }}>❌</button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleAddItem('participants')} className="reunion-btn">+ Ajouter</button>
              </>
            ) : (
              <div className="chip-list">
                {Array.isArray(reunion.participants) && reunion.participants.length > 0 ? (
                  reunion.participants.map((p, i) => (
                    <span key={i} className="chip">{p.nom} {p.fonction}</span>
                  ))
                ) : (
                  <p className="placeholder">—</p>
                )}
              </div>
            )}
          </div>
        </div>

        {champVisibles.find(c => c.nom_champ === 'commentaires')?.visible && (
          <div className="reunion-section">
            <h3>Objectifs</h3>
            {editMode ? (
              <textarea name="objectifs" value={editForm.objectifs || ''} onChange={handleChange} className="content-box" style={{ minHeight: '120px' }} />
            ) : (
              <div className="content-box">{reunion.objectifs || '—'}</div>
            )}
          </div>
        )}

        {['ordre_du_jour', 'decisions', 'taches'].map((field) => (
          champVisibles.find(c => c.nom_champ === field)?.visible && (
            <div key={field} className="reunion-section">
              <h3>{field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
              {editMode ? (
                <>
                  <ul>
                    {editForm[field]?.map((item, i) => (
                      <li key={i}>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleListChange(field, i, e.target.value)}
                          style={{ width: '90%' }}
                        />
                        <button onClick={() => handleRemoveItem(field, i)} style={{ marginLeft: '0.5rem' }}>❌</button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handleAddItem(field)} className="reunion-btn">+ Ajouter</button>
                </>
              ) : (
                <ul>
                  {editForm[field]?.length ? (
                    editForm[field].map((item, i) => <li key={i}>{item}</li>)
                  ) : <li>—</li>}
                </ul>
              )}
            </div>
          )
        ))}

        {champVisibles.find(c => c.nom_champ === 'commentaires')?.visible && (
          <div className="reunion-section">
            <h3>Commentaires</h3>
            {editMode ? (
              <textarea name="commentaires" value={editForm.commentaires || ''} onChange={handleChange} className="content-box" style={{ minHeight: '100px' }} />
            ) : (
              <div className="content-box">{reunion.commentaires || '—'}</div>
            )}
          </div>
        )}

        {editMode && (
          <button className="reunion-btn" onClick={saveChanges} style={{ marginTop: '2rem' }}>
            Enregistrer
          </button>
        )}
      </div>

      <ChampsSettingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        preferences={champVisibles}
        setPreferences={setChampVisibles}
        utilisateurId={userId}
        supabase={supabase}
      />
    </>
  );
};

export default ReunionDetail;