import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../helper/SupabaseClient';
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

  if (!reunion) return <p>Chargement...</p>;

  return (
    <div className="reunion-page">
      <div className="reunion-form">
        <h1>{reunion.titre}</h1>
        <p><strong>Date :</strong> {reunion.date_reunion}</p>
        <p><strong>Heure :</strong> {reunion.heure_debut || '—'} → {reunion.heure_fin || '—'}</p>
        <p><strong>Lieu :</strong> {reunion.lieu || '—'}</p>

        <h3>Participants</h3>
        <ul>
          {Array.isArray(reunion.participants) &&
            reunion.participants.map((p, i) => (
              <li key={i}>{p.nom} ({p.fonction})</li>
            ))}
        </ul>

        <h3>Objectifs</h3>
        <p>{reunion.objectifs || '—'}</p>

        <h3>Ordre du jour</h3>
        <ul>
          {Array.isArray(reunion.ordre_du_jour) &&
            reunion.ordre_du_jour.map((point, i) => <li key={i}>{point}</li>)}
        </ul>

        <h3>Compte rendu</h3>
        <p>{reunion.contenu || '—'}</p>

        <h3>Décisions</h3>
        <ul>
          {Array.isArray(reunion.decisions) &&
            reunion.decisions.map((d, i) => (
              <li key={i}><strong>{d.decision}</strong> — {d.responsable} (avant le {d.deadline})</li>
            ))}
        </ul>

        <h3>Tâches</h3>
        <ul>
          {Array.isArray(reunion.taches) &&
            reunion.taches.map((t, i) => (
              <li key={i}>{t.tache} — assigné à {t.assigne_a} (échéance : {t.echeance})</li>
            ))}
        </ul>

        <h3>Commentaires</h3>
        <p>{reunion.commentaires || '—'}</p>
      </div>
    </div>
  );
};

export default ReunionDetail;
