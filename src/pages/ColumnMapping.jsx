import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient.js';
import '../pages/css/ColumnMapping.css';

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
    const navigate = useNavigate();
    const location = useLocation();
  
    const headers = propsHeaders || location.state?.headers;
    const parsedRows = location.state?.parsedRows;
  
    const previewData = headers?.reduce((acc, h) => {
      acc[h] = parsedRows.map(row => row[h]);
      return acc;
    }, {});
  
    if (!headers || !parsedRows) {
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

  const handleSubmit = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;
  
    const { data: userData, error: userError } = await supabase
      .from('utilisateurs')
      .select('entreprise_id')
      .eq('id', user.id)
      .single();
  
    if (userError || !userData) return;
  
    const entrepriseId = userData.entreprise_id;
  
    const leadsToInsert = location.state?.parsedRows.map(row => {
      const lead = {
        user_id: user.id,
        entreprise_id: entrepriseId,
        source: 'import_csv'
      };
      for (const [fileCol, crmField] of Object.entries(mapping)) {
        if (crmField && row[fileCol] !== undefined) {
          lead[crmField] = row[fileCol];
        }
      }
      return lead;
    });
  
    const { error: insertError } = await supabase.from('leads').insert(leadsToInsert);
    if (insertError) {
      alert("Erreur lors de l'import : " + insertError.message);
    } else {
      alert("Import réussi ✅");
      navigate('/leads');
    }
  };
  

  const numProspects = previewData[headers[0]]?.length || 0;

  return (
    <div className="mapping-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <h2 className="mapping-title">🧹 Données de mapping</h2>
      <p className="mapping-subtitle">
        {numProspects} prospect{numProspects > 1 ? 's' : ''} détecté{numProspects > 1 ? 's' : ''}
      </p>

      <div className="mapping-fields">
        {headers.map(header => (
          <div key={header} className="mapping-row">
            <div className="mapping-label">{header}</div>
            <div className="mapping-preview">{(previewData[header] || []).slice(0, 3).join(', ')}</div>
            <select
              value={mapping[header] || ''}
              onChange={(e) => handleChange(header, e.target.value)}
              className="mapping-select"
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

      <div className="mapping-footer">
        <button onClick={handleSubmit} className="mapping-submit">
          ✅ Valider le mapping
        </button>
      </div>
    </div>
  );
}
