import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient.js';

const crmFields = [
  { label: 'Ne pas importer', value: null },
  { label: 'Prénom', value: 'prenom' },
  { label: 'Nom', value: 'nom' },
  { label: 'Email professionnel', value: 'email_professionnel' },
  { label: 'Téléphone professionnel', value: 'telephone_professionnel' },
  { label: 'Nom entreprise', value: 'nom_entreprise' },
  { label: 'Statut client', value: 'statut_client' },
  { label: 'Notes', value: 'notes' },
  { label: 'Source', value: 'source' },
  { label: 'Assigné à', value: 'assigne_a' },
  { label: 'Date de naissance', value: 'date_naissance' },
  { label: 'Poste contact', value: 'poste_contact' },
  { label: 'Site web', value: 'site_web' },
  { label: 'Adresse rue', value: 'adresse_entreprise_rue' },
  { label: 'Ville', value: 'adresse_entreprise_ville' },
  { label: 'Code postal', value: 'adresse_entreprise_cp' },
  { label: 'Pays', value: 'adresse_entreprise_pays' },
  { label: 'SIRET', value: 'numero_siret' },
  { label: 'TVA intracom', value: 'numero_tva_intracom' },
  { label: 'Canal préféré', value: 'canal_prefere' },
  { label: 'Langue', value: 'langue' },
  { label: 'Origine contact', value: 'origine_contact' },
  { label: 'Date 1er contact', value: 'date_premier_contact' },
  { label: 'Date dernier contact', value: 'date_dernier_contact' },
  { label: 'Fréquence contact', value: 'frequence_contact' },
  { label: 'Produits achetés', value: 'produits_achetes' },
  { label: 'Historique commandes', value: 'historique_commandes' },
  { label: 'Montant total', value: 'montant_total' },
  { label: 'Devis envoyés', value: 'devis_envoyes' },
  { label: 'Statut paiement', value: 'statut_paiement' },
  { label: 'Niveau priorité', value: 'niveau_priorite' },
  { label: 'Tags', value: 'tags' },
  { label: 'Documents', value: 'documents' }
];

export default function ColumnMapping({ headers: propsHeaders, previewData: propsPreviewData, onMappingComplete }) {
  const location = useLocation();
  const navigate = useNavigate();

  const headers = propsHeaders || location.state?.headers;
  const previewData = propsPreviewData || location.state?.parsedRows?.reduce((acc, row) => {
    headers?.forEach(h => {
      acc[h] = acc[h] || [];
      acc[h].push(row[h]);
    });
    return acc;
  }, {}) || {};

  if (!headers || !previewData) {
    navigate('/leads');
    return null;
  }

  const [mapping, setMapping] = useState(() => {
    const normalize = (str) =>
      str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const autoMap = (header) => {
      const normalizedHeader = normalize(header);
      const match = crmFields.find(f => normalize(f.label) === normalizedHeader);
      return match?.value || '';
    };
    return headers.reduce((acc, h) => {
      acc[h] = autoMap(h);
      return acc;
    }, {});
  });

  const handleChange = (header, value) => {
    setMapping(prev => ({ ...prev, [header]: value }));
  };

  const handleSubmit = () => {
    if (onMappingComplete) onMappingComplete(mapping);
  };

  const numProspects = previewData[headers[0]]?.length || 0;

  return (
    <div
      className="mapping-container"
      style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        maxHeight: 'calc(100vh - 1rem)',
        overflowY: 'auto',
        paddingBottom: '5rem'
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: '2rem',
          padding: '0.6rem 1.2rem',
          fontWeight: 'bold',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#111e23',
          color: 'white',
          cursor: 'pointer'
        }}
      >
        ← Retour
      </button>

      <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' }}>
        🧹 Données de mapping
      </h2>
      <p style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '2rem' }}>
        {numProspects} prospect{numProspects > 1 ? 's' : ''} détecté{numProspects > 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {headers.map(header => (
            <div
            key={header}
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                borderBottom: '1px solid #333',
                paddingBottom: '0.5rem'
            }}
            >
            <div style={{ flex: 1, fontWeight: 'bold' }}>{header}</div>
            <div style={{ flex: 2, fontSize: '0.9rem', color: '#aaa' }}>
                {(previewData[header] || []).slice(0, 3).join(', ')}
            </div>
            <select
                value={mapping[header] || ''}
                onChange={(e) => handleChange(header, e.target.value)}
                style={{ flex: 1.2, padding: '0.4rem', borderRadius: '6px' }}
            >
                {crmFields.map(field => (
                <option key={field.value || 'none'} value={field.value || ''}>
                    {field.label}
                </option>
                ))}
            </select>
            </div>
        ))}
        </div>


      <div
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#111e23',
          padding: '1rem 0',
          marginTop: '2rem',
          textAlign: 'center',
          zIndex: 10,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.3)'
        }}
      >
        <button
          onClick={handleSubmit}
          style={{
            padding: '0.9rem 1.8rem',
            fontWeight: 'bold',
            borderRadius: '8px',
            backgroundColor: '#4BB543',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✅ Valider le mapping
        </button>
      </div>
    </div>
  );
}
