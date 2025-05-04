import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState([]);

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

  const allFields = [...availableFields, ...customFields.map(f => ({
    label: f.nom_affichage,
    name: f.nom_champ,
    type: f.type
  }))];

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
        .eq('id', leadData.user_id);

      if (userErr || !userData?.[0]) return;

      const { data: custom, error: customErr } = await supabase
        .from('champs_personnalises')
        .select('*')
        .eq('entreprise_id', userData[0].entreprise_id);

      if (!customErr && custom) {
        setCustomFields(custom);
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
    const confirm = window.confirm("Supprimer définitivement ce prospect ?");
    if (!confirm) return;

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
        {allFields.map(({ label, name, type = "text" }) => (
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
        <button onClick={handleSave}>💾 Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>🗑️ Supprimer</button>
      </div>
    </div>
  );
}
