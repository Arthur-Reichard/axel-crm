import React, { useState, useEffect } from 'react';
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

export default function ColumnMapping({ headers, previewData, onMappingComplete }) {
  const [mapping, setMapping] = useState(() => {
    const normalize = (str) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // enlève les accents
        .replace(/[^a-z0-9]/g, '');     // enlève les caractères spéciaux

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
    <div className="mapping-container">
      <h2>🧩 Données de mapping</h2>
      <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
        {numProspects} prospect{numProspects > 1 ? 's' : ''} détecté{numProspects > 1 ? 's' : ''}
      </p>

      {headers.map(header => (
        <div key={header} className="mapping-row">
          <div className="mapping-col header"><strong>{header}</strong></div>
          <div className="mapping-col data-preview">
            {(previewData[header] || []).slice(0, 3).join(', ')}
          </div>
          <div className="mapping-col select">
            <select
              value={mapping[header] || ''}
              onChange={(e) => handleChange(header, e.target.value)}
            >
              {crmFields.map(field => (
                <option key={field.value || 'none'} value={field.value || ''}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      <button className="validate-mapping" onClick={handleSubmit}>
        Valider le mapping
      </button>
    </div>
  );
}
