import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import '../pages/css/Leads.css';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erreur chargement lead :", error);
        return;
      }

      setLead(data);
      setLoading(false);
    };

    fetchLead();
  }, [id]);

  const handleChange = (e) => {
    setLead((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
      console.error(error);
    } else {
      alert("Lead mis à jour ✅");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Supprimer définitivement ce prospect ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      navigate('/leads');
    }
  };

  if (loading || !lead) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  const mainFields = [
    { label: "Nom", name: "nom" },
    { label: "Prénom", name: "prenom" },
    { label: "Email", name: "email", type: "email" },
    { label: "Téléphone", name: "phone" },
    { label: "Entreprise", name: "company" },
  ];

  const extraFields = [
    { label: "Adresse", name: "adresse" },
    { label: "Ville", name: "ville" },
    { label: "Source", name: "source" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Dernières actions", name: "notes", type: "textarea" },
  ];

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Fiche du Prospect</h1>
        <button onClick={() => navigate('/leads')}>← Retour</button>
      </div>

      <div className="lead-detail-grid">
        {mainFields.map(({ label, name, type = "text" }) => (
          <div className="lead-field" key={name}>
            <label htmlFor={name}>{label}</label>
            <input
              id={name}
              type={type}
              name={name}
              value={lead[name] || ''}
              onChange={handleChange}
            />
          </div>
        ))}

        {showMore && extraFields.map(({ label, name, type = "text" }) => (
          <div className="lead-field" key={name} style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}>
            <label htmlFor={name}>{label}</label>
            {type === "textarea" ? (
              <textarea
                id={name}
                name={name}
                value={lead[name] || ''}
                onChange={handleChange}
              />
            ) : (
              <input
                id={name}
                type={type}
                name={name}
                value={lead[name] || ''}
                onChange={handleChange}
              />
            )}
          </div>
        ))}

        {!showMore && (
          <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
            <button onClick={() => setShowMore(true)} style={{ padding: '0.6rem 1.2rem' }}>
              + Ajouter plus d'infos
            </button>
          </div>
        )}
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>💾 Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>🗑️ Supprimer</button>
      </div>
    </div>
  );
}
