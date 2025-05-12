import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';
import { FiEye, FiEyeOff, FiSettings } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return null;

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFields, setVisibleFields] = useState([]);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const clientType = searchParams.get("type") || "individuel";

  const availableFields = [
    { label: "Nom", name: "nom" },
    { label: "Prénom", name: "prenom" },
    { label: "Email", name: "email_professionnel" },
    { label: "Téléphone", name: "telephone_professionnel" },
    { label: "Entreprise", name: "nom_entreprise" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Poste contact", name: "poste_contact" },
    { label: "Site web", name: "site_web" },
    { label: "Rue entreprise", name: "adresse_entreprise_rue" },
    { label: "Ville entreprise", name: "adresse_entreprise_ville" },
    { label: "Code postal entreprise", name: "adresse_entreprise_cp" },
    { label: "Pays entreprise", name: "adresse_entreprise_pays" },
    { label: "SIRET", name: "numero_siret" },
    { label: "Canal préféré", name: "canal_prefere" },
    { label: "Langue", name: "langue" },
    { label: "Origine contact", name: "origine_contact" },
    { label: "Statut client", name: "statut_client" },
    { label: "Date premier contact", name: "date_premier_contact", type: "date" },
    { label: "Date dernier contact", name: "date_dernier_contact", type: "date" },
    { label: "Devis envoyés", name: "devis_envoyes" },
    { label: "Statut paiement", name: "statut_paiement" },
    { label: "Assigné à", name: "assigne_a" },
    { label: "Niveau priorité", name: "niveau_priorite" },
    { label: "Notes", name: "notes", type: "textarea" }
  ];

  const allFields = useMemo(() => [
    ...availableFields,
    ...customFields.map(f => ({
      label: f.nom_affichage,
      name: f.nom_champ,
      type: f.type
    }))
  ], [customFields]);

  useEffect(() => {
    const fetchLeadAndFields = async () => {
      const { data: leadData, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadErr || !leadData) {
        console.error("Erreur chargement lead :", leadErr);
        return;
      }

      const { data: userData, error: userErr } = await supabase
        .from('utilisateurs')
        .select('entreprise_id')
        .eq('id', leadData.user_id)
        .single();

      if (userErr || !userData) return;

      const entrepriseId = userData.entreprise_id;

      const [{ data: customFieldsData, error: customErr }, { data: visibles, error: visibleErr }] = await Promise.all([
        supabase
          .from('champs_personnalises')
          .select('*')
          .eq('entreprise_id', entrepriseId),

        supabase
          .from('champs_visibles')
          .select('nom_champ')
          .eq('entreprise_id', entrepriseId)
          .eq('visible', true)
          .eq('type_fiche', 'lead')
      ]);

      if (customErr) {
        console.error("Erreur chargement champs personnalisés :", customErr);
      } else {
        setCustomFields(customFieldsData);
      }

      if (visibleErr) {
        console.error("Erreur chargement champs visibles :", visibleErr);
      } else {
        setVisibleFields(visibles.map(v => v.nom_champ));
      }

      setLead(leadData);
      setLoading(false);
    };

    fetchLeadAndFields();
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
    } else {
      localStorage.setItem('leadUpdated', 'true');
      navigate('/leads');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement ce prospect ?")) return;

    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      navigate('/leads');
    }
  };

  if (loading || !lead || allFields.length === 0) {
    return <p style={{ padding: '2rem' }}>Chargement...</p>;
  }

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
      <h1>Fiche du Prospect</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button onClick={() => navigate(`/leads?type=${clientType}`)}>← Retour</button>
      <button
        onClick={() => setFieldSettingsOpen(true)}
        className="settings-btn"
        title="Gérer les champs visibles"
      >
        <FiSettings size={22} />
      </button>
    </div>
      </div>

      <div className="lead-detail-grid">
        {allFields
          .filter(field => visibleFields.includes(field.name))
          .map(({ label, name, type = "text" }) => (
            <div className="lead-field" key={name} style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}>
              <label htmlFor={name}>{label}</label>
              {type === "textarea" ? (
                <textarea id={name} name={name} value={lead[name] || ''} onChange={handleChange} />
              ) : (
                <input id={name} type={type} name={name} value={lead[name] || ''} onChange={handleChange} />
              )}
            </div>
          ))}

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Date d'ajout</label>
          <input type="text" value={new Date(lead.created_at).toLocaleString()} readOnly />
        </div>
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Dernière modification</label>
          <input type="text" value={new Date(lead.updated_at).toLocaleString()} readOnly />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>Supprimer</button>
      </div>
      {fieldSettingsOpen && (
  <div className="drawer-overlay" onClick={() => setFieldSettingsOpen(false)}>
    <div className="drawer" onClick={(e) => e.stopPropagation()}>
      <h2>Champs visibles</h2>
      <ul className="custom-field-list">
        {allFields.map(field => (
          <li key={field.name} className="custom-field-item">
            <span>{field.label}</span>
            <button
              onClick={async () => {
                const isVisible = visibleFields.includes(field.name);
                const entrepriseId = lead.entreprise_id;

                const { error } = await supabase
                  .from('champs_visibles')
                  .upsert({
                    entreprise_id: entrepriseId,
                    nom_champ: field.name,
                    visible: !isVisible,
                    type_fiche: 'lead'
                  }, { onConflict: ['entreprise_id', 'nom_champ', 'type_fiche'] })

                if (error) {
                  console.error("Erreur modification visibilité :", error.message);
                  return;
                }

                const { data: visibles, error: fetchErr } = await supabase
                  .from('champs_visibles')
                  .select('nom_champ')
                  .eq('entreprise_id', entrepriseId)
                  .eq('visible', true);

                if (!fetchErr) {
                  setVisibleFields(visibles.map(v => v.nom_champ));
                }
              }}
            >
              {visibleFields.includes(field.name) ? <FiEye /> : <FiEyeOff />}
            </button>
          </li>
        ))}
      </ul>

      <div className="drawer-buttons">
        <button className="cancel-btn" onClick={() => setFieldSettingsOpen(false)}>Fermer</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}