import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import './css/LeadDetail.css';

export default function MaterielDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materiel, setMateriel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fields = [
    { label: "Nom", name: "nom" },
    { label: "Type", name: "type" },
    { label: "Statut", name: "statut", type: "select", options: ["En service", "En maintenance", "Hors service"] },
    { label: "Localisation", name: "localisation" },
    { label: "Date d’acquisition", name: "date_acquisition", type: "date" },
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
      .update(materiel)
      .eq('id', id);

    if (error) {
      alert("Erreur de mise à jour : " + error.message);
    } else {
      navigate('/materiel');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement ce matériel ?")) return;

    const { error } = await supabase
      .from('materiels')
      .delete()
      .eq('id', id);

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
        <h1>Fiche Matériel</h1>
        <button onClick={() => navigate('/materiel')}>← Retour</button>
      </div>

      <div className="lead-detail-grid">
        {fields.map(({ label, name, type = "text", options }) => (
          <div key={name} className="lead-field" style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}>
            <label htmlFor={name}>{label}</label>
            {type === "textarea" ? (
              <textarea name={name} value={materiel[name] || ''} onChange={handleChange} />
            ) : type === "select" ? (
              <select name={name} value={materiel[name] || ''} onChange={handleChange}>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input type={type} name={name} value={materiel[name] || ''} onChange={handleChange} />
            )}
          </div>
        ))}

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
        <label>Date d'ajout</label>
        <input
            type="text"
            value={materiel.created_at ? new Date(materiel.created_at).toLocaleString('fr-FR') : '—'}
            readOnly
        />
        </div>

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
        <label>Dernière modification</label>
        <input
            type="text"
            value={materiel.updated_at ? new Date(materiel.updated_at).toLocaleString('fr-FR') : '—'}
            readOnly
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
