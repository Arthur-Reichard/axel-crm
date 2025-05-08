import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';
import AdresseAutocomplete from '../components/AdresseAutocomplete';

export default function EntrepriseClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);

  const entrepriseFields = [
    { label: "Nom de l'entreprise", name: "nom" },
    { label: "SIREN", name: "siren" },
    { label: "Téléphone", name: "telephone_professionnel" },
    { label: "Email", name: "email_professionnel" },
    { label: "Site web", name: "site_web" },
    { label: "Notes", name: "notes", type: "textarea" }
  ];

  useEffect(() => {
    const fetchEntreprise = async () => {
      const { data, error } = await supabase
        .from('entreprises_clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("Erreur chargement entreprise :", error);
        return;
      }

      setEntreprise(data);
      setLoading(false);
    };

    fetchEntreprise();
  }, [id]);

  const handleChange = (e) => {
    setEntreprise((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('entreprises_clients')
      .update(entreprise)
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      localStorage.setItem('leadUpdated', 'true');
      navigate('/leads');
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Supprimer définitivement cette entreprise ?");
    if (!confirm) return;

    const { error } = await supabase
      .from('entreprises_clients')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      navigate('/leads');
    }
  };

  if (loading || !entreprise) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Fiche Entreprise</h1>
        <button onClick={() => navigate('/leads')}>← Retour</button>
      </div>

      <div className="lead-detail-grid">
        {entrepriseFields.map(({ label, name, type = "text" }) => (
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
                value={entreprise[name] || ''}
                onChange={handleChange}
              />
            ) : (
              <input
                id={name}
                type={type}
                name={name}
                value={entreprise[name] || ''}
                onChange={handleChange}
              />
            )}
          </div>
        ))}

        {/* Champ autocomplete d'adresse Google */}
        <div className="lead-field adresse-bloc">
          <label>Adresse (auto-complétée)</label>
          <AdresseAutocomplete
            onPlaceSelected={(place) => {
              const components = place.address_components;
              const get = (type) =>
                components.find((c) => c.types.includes(type))?.long_name || '';

              setEntreprise((prev) => ({
                ...prev,
                adresse_entreprise_rue: `${get('street_number')} ${get('route')}`.trim(),
                adresse_entreprise_ville: get('locality'),
                adresse_entreprise_cp: get('postal_code'),
                adresse_entreprise_pays: get('country')
              }));
            }}
          />
        </div>

        {/* Champs séparés visibles */}
        <div className="adresse-hidden-fields">
          <div className="lead-field">
            <label>Rue</label>
            <input
              type="text"
              name="adresse_entreprise_rue"
              value={entreprise.adresse_entreprise_rue || ''}
              onChange={handleChange}
            />
          </div>
          <div className="lead-field">
            <label>Ville</label>
            <input
              type="text"
              name="adresse_entreprise_ville"
              value={entreprise.adresse_entreprise_ville || ''}
              onChange={handleChange}
            />
          </div>
          <div className="lead-field">
            <label>Code Postal</label>
            <input
              type="text"
              name="adresse_entreprise_cp"
              value={entreprise.adresse_entreprise_cp || ''}
              onChange={handleChange}
            />
          </div>
          <div className="lead-field">
            <label>Pays</label>
            <input
              type="text"
              name="adresse_entreprise_pays"
              value={entreprise.adresse_entreprise_pays || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Dates en bas */}
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Date d'ajout</label>
          <input type="text" value={new Date(entreprise.created_at).toLocaleString()} readOnly />
        </div>
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Dernière modification</label>
          <input type="text" value={new Date(entreprise.updated_at).toLocaleString()} readOnly />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>Supprimer</button>
      </div>
    </div>
  );
}