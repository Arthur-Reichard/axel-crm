import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const allFields = [
    { label: "Nom", name: "nom" },
    { label: "Prénom", name: "prenom" },
    { label: "Email", name: "email_professionnel" },
    { label: "Téléphone", name: "telephone_professionnel" },
    { label: "Entreprise", name: "nom_entreprise" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Rue (perso)", name: "adresse_rue" },
    { label: "Ville (perso)", name: "adresse_ville" },
    { label: "Code postal (perso)", name: "adresse_cp" },
    { label: "Pays (perso)", name: "adresse_pays" },
    { label: "Date de naissance", name: "date_naissance", type: "date" },
    { label: "Nom contact", name: "nom_contact" },
    { label: "Poste contact", name: "poste_contact" },
    { label: "Site web", name: "site_web" },
    { label: "Rue entreprise", name: "adresse_entreprise_rue" },
    { label: "Ville entreprise", name: "adresse_entreprise_ville" },
    { label: "Code postal entreprise", name: "adresse_entreprise_cp" },
    { label: "Pays entreprise", name: "adresse_entreprise_pays" },
    { label: "SIRET", name: "numero_siret" },
    { label: "TVA intracom", name: "numero_tva_intracom" },
    { label: "Canal préféré", name: "canal_prefere" },
    { label: "Langue", name: "langue" },
    { label: "Origine contact", name: "origine_contact" },
    { label: "Statut client", name: "statut_client" },
    { label: "Date premier contact", name: "date_premier_contact", type: "date" },
    { label: "Date dernier contact", name: "date_dernier_contact", type: "date" },
    { label: "Fréquence contact", name: "frequence_contact" },
    { label: "Produits achetés", name: "produits_achetes", type: "textarea" },
    { label: "Montant total", name: "montant_total" },
    { label: "Devis envoyés", name: "devis_envoyes" },
    { label: "Statut paiement", name: "statut_paiement" },
    { label: "Assigné à", name: "assigne_a" },
    { label: "Niveau priorité", name: "niveau_priorite" },
    { label: "Tags", name: "tags" },
    { label: "Notes", name: "notes", type: "textarea" }
  ];

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
      localStorage.setItem('leadUpdated', 'true'); 
      navigate('/leads');
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
