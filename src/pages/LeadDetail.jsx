import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import '../pages/css/Leads.css';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Fiche du Prospect</h1>
        <button onClick={() => navigate('/leads')}>← Retour</button>
      </div>

      <div className="lead-detail-grid">
        {[
          { label: "Nom", name: "nom" },
          { label: "Prénom", name: "prenom" },
          { label: "Email", name: "email", type: "email" },
          { label: "Téléphone", name: "phone" },
          { label: "Entreprise", name: "company" },
          { label: "Adresse", name: "adresse" },
          { label: "Ville", name: "ville" },
          { label: "Source", name: "source" },
        ].map(({ label, name, type = "text" }) => (
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

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={lead.description || ''}
            onChange={handleChange}
          />
        </div>

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="notes">Dernières actions</label>
          <textarea
            id="notes"
            name="notes"
            value={lead.notes || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>💾 Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>🗑️ Supprimer</button>
      </div>
    </div>
  );
}
