import React, { useEffect, useState, useRef } from 'react';
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
  const adresseRef = useRef({}); // 🧠 stockage persistant des champs adresse

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
      adresseRef.current = {
        adresse_entreprise_rue: data.adresse_entreprise_rue,
        adresse_entreprise_cp: data.adresse_entreprise_cp,
        adresse_entreprise_ville: data.adresse_entreprise_ville,
        adresse_entreprise_pays: data.adresse_entreprise_pays
      };

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
    if (!entreprise) {
      console.warn("❌ handleSave : entreprise est null");
      return;
    }

    const payload = {
      ...entreprise,
      ...adresseRef.current
    };

    console.log("📝 Données envoyées à Supabase :", payload);

    const { error, data } = await supabase
      .from('entreprises_clients')
      .update(payload)
      .eq('id', id)
      .select();

    console.log("📥 Supabase response:", data);

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      console.log("✅ Données enregistrées avec succès");
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
              console.log("📍 place reçu :", place);

              const components = place.address_components || [];

              const get = (type) =>
                components.find((c) => c.types.includes(type))?.long_name || '';

              const streetNumber = get('street_number');
              const route = get('route');
              const ville = get('locality') || get('postal_town');
              const codePostal = get('postal_code');
              const pays = get('country');

              const newAdresse = {
                adresse_entreprise_rue: [streetNumber, route].filter(Boolean).join(' '),
                adresse_entreprise_ville: ville,
                adresse_entreprise_cp: codePostal,
                adresse_entreprise_pays: pays
              };

              console.log("📦 Données extraites de l'adresse :", newAdresse);

              // Stock dans ref persistante
              adresseRef.current = newAdresse;

              // Pour affichage immédiat dans les champs
              setEntreprise((prev) => {
                if (!prev) {
                  console.warn("❌ setEntreprise ignoré : prev est null");
                  return prev;
                }

                const updated = { ...prev, ...newAdresse };
                console.log("✅ Entreprise mise à jour dans l'état :", updated);
                return updated;
              });
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
              disabled
            />
          </div>
          <div className="lead-field">
            <label>Ville</label>
            <input
              type="text"
              name="adresse_entreprise_ville"
              value={entreprise.adresse_entreprise_ville || ''}
              disabled
            />
          </div>
          <div className="lead-field">
            <label>Code Postal</label>
            <input
              type="text"
              name="adresse_entreprise_cp"
              value={entreprise.adresse_entreprise_cp || ''}
              disabled
            />
          </div>
          <div className="lead-field">
            <label>Pays</label>
            <input
              type="text"
              name="adresse_entreprise_pays"
              value={entreprise.adresse_entreprise_pays || ''}
              disabled
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