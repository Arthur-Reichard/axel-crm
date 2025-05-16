import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/ColumnMapping.css'; // On réutilise le même CSS

// Champs disponibles pour le mapping vers entreprises_clients
const entrepriseFields = [
  { label: 'Ne pas importer', value: null },
  { label: 'SIREN', value: 'siren' },
  { label: 'SIRET', value: 'siret' },
  { label: 'Raison sociale', value: 'raison_sociale' },
  { label: 'Forme juridique', value: 'forme_juridique' },
  { label: 'Capital social', value: 'capital_social' },
  { label: 'Date immatriculation', value: 'date_immatriculation' },
  { label: 'Statut entreprise', value: 'statut_entreprise' },
  { label: 'N° RCS', value: 'numero_rcs' },
  { label: 'Site web', value: 'site_web' },
  { label: 'Notes', value: 'notes' },
  { label: 'Email professionnel', value: 'email_professionnel' },
  { label: 'Téléphone professionnel', value: 'telephone_professionnel' },
  { label: 'Adresse rue', value: 'adresse_entreprise_rue' },
  { label: 'Adresse CP', value: 'adresse_entreprise_cp' },
  { label: 'Adresse ville', value: 'adresse_entreprise_ville' },
  { label: 'Adresse pays', value: 'adresse_entreprise_pays' },
  { label: 'Siège rue', value: 'siege_social_rue' },
  { label: 'Siège CP', value: 'siege_social_cp' },
  { label: 'Siège ville', value: 'siege_social_ville' },
  { label: 'Siège pays', value: 'siege_social_pays' },
  { label: 'Code NAF', value: 'naf_code' },
  { label: 'Libellé NAF', value: 'naf_label' },
  { label: 'Catégorie juridique', value: 'categorie_juridique_code' },
  { label: 'Catégorie entreprise', value: 'categorie_entreprise' },
  { label: 'Année catégorie', value: 'annee_categorie_entreprise' }
];

// Champs à exclure
const excludedHeaders = [
  'id',
  'created_at',
  'updated_at',
  'entreprise_id',
  'created_by',
  'dernier_traitement',
  'date_derniere_mise_a_jour'
];

export default function EntrepriseColumnMapping({ headers: propsHeaders, previewData: propsPreviewData }) {
  const navigate = useNavigate();
  const location = useLocation();

  const headers = (propsHeaders || location.state?.headers || []).filter(
    h => !excludedHeaders.includes(h.toLowerCase())
  );
  const parsedRows = location.state?.parsedRows;

  const previewData = headers.reduce((acc, h) => {
    acc[h] = parsedRows.map(row => row[h]);
    return acc;
  }, {});

  if (!headers || !parsedRows) {
    navigate('/entreprises'); // ou /clients selon ta route
    return null;
  }

  const [mapping, setMapping] = useState(() => {
    const normalize = (str) =>
      str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const autoMap = (header) => {
      const normalizedHeader = normalize(header);
      const match = entrepriseFields.find(f => normalize(f.label) === normalizedHeader);
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

    const entreprisesToInsert = parsedRows.map(row => {
      const entreprise = {
        created_by: user.id,
        entreprise_id: entrepriseId
      };
      for (const [fileCol, dbField] of Object.entries(mapping)) {
        if (dbField && row[fileCol] !== undefined) {
          entreprise[dbField] = row[fileCol];
        }
      }
      return entreprise;
    });

    const { error: insertError } = await supabase.from('entreprises_clients').insert(entreprisesToInsert);
    if (insertError) {
      alert("Erreur lors de l'import : " + insertError.message);
    } else {
      alert("Import entreprises réussi ✅");
      navigate('/entreprises'); // à adapter à ta route réelle
    }
  };

  const numRows = previewData[headers[0]]?.length || 0;

  return (
    <div className="mapping-container">
      <button className="back-button" onClick={() => navigate(-1)}>← Retour</button>

      <h2 className="mapping-title">Données de mapping – entreprises</h2>
      <p className="mapping-subtitle">
        {numRows} ligne{numRows > 1 ? 's' : ''} détectée{numRows > 1 ? 's' : ''}
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
              {entrepriseFields.map(field => (
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
          Valider le mapping
        </button>
      </div>
    </div>
  );
}