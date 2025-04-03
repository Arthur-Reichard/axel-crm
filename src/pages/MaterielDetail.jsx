import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import './css/LeadDetail.css'; // Réutilisation du style existant

export default function MaterielDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materiel, setMateriel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fields = [
    { label: "Nom", name: "nom" },
    { label: "Type", name: "type" },
    { label: "Statut", name: "statut" },
    { label: "Localisation", name: "localisation" },
    { label: "Date d'acquisition", name: "date_acquisition", type: "date" },
    { label: "Numéro de série", name: "numero_serie" },
    { label: "Remarques", name: "remarques", type: "textarea" }
  ];

  useEffect(() => {
    const fetchMateriel = async () => {
      const { data, error } = await supabase
        .from('materiels')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erreur chargement matériel :", error);
        return;
      }

      setMateriel(data);
      setLoading(false);
    };

    fetchMateriel();
  }, [id]);

  const handleChange = (e) => {
    setMateriel((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('materiels')
      .update({
        ...materiel,
        date_acquisition: materiel.date_acquisition || null
      })
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      navigate('/materiel');
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Supprimer ce matériel ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from('materiels').delete().eq('id', id);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      navigate('/materiel');
    }
  };

  if (loading || !materiel) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Détail Matériel</h1>
        <button onClick={() => navigate('/materiel')}>← Retour</button>
      </div>

      <div className="lead-detail-grid">
        {fields.map(({ label, name, type = "text" }) => (
          <div
            className="lead-field"
            key={name}
            style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}
          >
            <label htmlFor={name}>{label}</label>
            {type === "textarea" ? (
              <textarea
                id={name}
                name={name}
                value={materiel[name] || ''}
                onChange={handleChange}
              />
            ) : (
              <input
                id={name}
                type={type}
                name={name}
                value={materiel[name] || ''}
                onChange={handleChange}
              />
            )}
          </div>
        ))}
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Date de création</label>
          <input type="text" value={new Date(materiel.created_at).toLocaleString()} readOnly />
        </div>
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Dernière modification</label>
          <input type="text" value={new Date(materiel.updated_at).toLocaleString()} readOnly />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>💾 Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>🗑️ Supprimer</button>
      </div>
    </div>
  );
}
