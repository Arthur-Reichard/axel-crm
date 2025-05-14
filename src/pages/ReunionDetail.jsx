import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "../helper/SupabaseClient";
import './css/Reunion.css';

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
    <div className="reunion-page">
      <h1>{reunion.titre}</h1>

      <div className="bloc">
        <div>
          <p><strong>Date :</strong> {reunion.date_reunion}</p>
          <p><strong>Heure :</strong> {reunion.heure_debut || '—'} → {reunion.heure_fin || '—'}</p>
          <p><strong>Lieu :</strong> {reunion.lieu || '—'}</p>
        </div>

        <div>
          <h3>Participants</h3>
          <div className="chip-list">
            {Array.isArray(reunion.participants) && reunion.participants.map((p, i) => (
              <span key={i} className="chip">{p.nom} ({p.fonction})</span>
            ))}
          </div>
        </div>
      </div>

      <h3>Objectifs</h3>
      <div className="content-box">
        {reunion.objectifs || '—'}
      </div>

      <h3>Ordre du jour</h3>
      <ul>
        {Array.isArray(reunion.ordre_du_jour) && reunion.ordre_du_jour.length > 0 ? (
          reunion.ordre_du_jour.map((point, i) => <li key={i}>{point}</li>)
        ) : (
          <li>—</li>
        )}
      </ul>

      <h3>Compte rendu</h3>
      <div className="content-box">
        {reunion.contenu || '—'}
      </div>

      <h3>Décisions</h3>
      <ul>
        {Array.isArray(reunion.decisions) && reunion.decisions.length > 0 ? (
          reunion.decisions.map((d, i) => (
            <li key={i}><strong>{d.decision}</strong> — {d.responsable} (avant le {d.deadline})</li>
          ))
        ) : (
          <li>—</li>
        )}
      </ul>

      <h3>Tâches</h3>
      <ul>
        {Array.isArray(reunion.taches) && reunion.taches.length > 0 ? (
          reunion.taches.map((t, i) => (
            <li key={i}>{t.tache} — assigné à {t.assigne_a} (échéance : {t.echeance})</li>
          ))
        ) : (
          <li>—</li>
        )}
      </ul>

      <h3>Commentaires</h3>
      <div className="content-box">
        {reunion.commentaires || '—'}
      </div>
    </div>
  );
};

export default ReunionDetail;
