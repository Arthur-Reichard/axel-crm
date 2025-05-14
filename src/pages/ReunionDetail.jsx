import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "../helper/SupabaseClient";
import './css/Reunion.css';
import DashboardNavbar from "./DashboardNavbar";

const ReunionDetail = () => {
  const { id } = useParams();
  const [reunion, setReunion] = useState(null);

  useEffect(() => {
    const fetchReunion = async () => {
      const { data, error } = await supabase
        .from('comptes_rendus_reunion')
        .select('*')
        .eq('id', id)
        .single();

      if (!error) setReunion(data);
    };

    fetchReunion();
  }, [id]);

  if (!reunion) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
  <>
    <DashboardNavbar />

<button className="reunion-retour-btn" onClick={() => window.history.back()}>
  ← Retour
</button>

    <div className="reunion-page">
      <h1>{reunion.titre || 'Sans titre'}</h1>

      <div className="reunion-detail-header">
        <div className="reunion-card">
          <p><strong>Date :</strong> {reunion.date_reunion}</p>
          <p><strong>Heure :</strong> {reunion.heure_debut || '—'} → {reunion.heure_fin || '—'}</p>
          <p><strong>Lieu :</strong> {reunion.lieu || '—'}</p>
        </div>

        <div className="reunion-card">
          <h3 className="card-title">Participants</h3>
          <div className="chip-list">
            {Array.isArray(reunion.participants) && reunion.participants.length > 0 ? (
              reunion.participants.map((p, i) => (
                <span key={i} className="chip">{p.nom} ({p.fonction})</span>
              ))
            ) : (
              <p className="placeholder">—</p>
            )}
          </div>
        </div>
      </div>

      <div className="reunion-section">
        <h3>Objectifs</h3>
        <div className="content-box">{reunion.objectifs || '—'}</div>
      </div>

      <div className="reunion-section">
        <h3>Ordre du jour</h3>
        <ul>{reunion.ordre_du_jour?.length ? (
          reunion.ordre_du_jour.map((p, i) => <li key={i}>{p}</li>)
        ) : <li>—</li>}</ul>
      </div>

      <div className="reunion-section">
        <h3>Compte rendu</h3>
        <div className="content-box">{reunion.contenu || '—'}</div>
      </div>

      <div className="reunion-section">
        <h3>Décisions</h3>
          <ul>
            {Array.isArray(reunion.decisions) && reunion.decisions.length > 0 ? (
              reunion.decisions.map((d, i) => <li key={i}>{d}</li>)
            ) : (
              <li>—</li>
            )}
          </ul>
      </div>

      <div className="reunion-section">
        <h3>Tâches</h3>
        {Array.isArray(reunion.taches) && reunion.taches.length > 0 ? (
          reunion.taches.map((t, i) => <li key={i}>{t}</li>)
        ) : (
          <li>—</li>
        )}
      </div>

      <div className="reunion-section">
        <h3>Commentaires</h3>
        <div className="content-box">{reunion.commentaires || '—'}</div>
      </div>
    </div>
  </>
);
};

export default ReunionDetail;
