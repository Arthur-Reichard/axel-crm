import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/css/Leads.css';
import supabase from '../helper/supabaseClient';
import ResizableTH from './ResizableTH';

const allColumns = [
  'Prénom', 'Nom', 'Email pro', 'Téléphone pro',
  'Entreprise', 'Statut', 'Assigné à', 'Notes'
];

const columnFieldMap = {
  'Prénom': 'prenom',
  'Nom': 'nom',
  'Email pro': 'email_professionnel',
  'Téléphone pro': 'telephone_professionnel',
  'Entreprise': 'nom_entreprise',
  'Statut': 'statut_client',
  'Assigné à': 'assigne_a',
  'Notes': 'notes'
};

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [colWidths, setColWidths] = useState({});
  const navigate = useNavigate();

  const [selectedColumns, setSelectedColumns] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('selectedColumns'));
    const defaultCols = allColumns;
    return Array.isArray(stored) ? stored.filter(col => defaultCols.includes(col)) : defaultCols;
  });
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email_professionnel: '',
    telephone_professionnel: '',
    nom_entreprise: '',
    statut_client: '',
    source: '',
    notes: '',
    assigne_a: ''
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw userError;

        const { data: utilisateurs, error: userInfoError } = await supabase
          .from('utilisateurs')
          .select('entreprise_id')
          .eq('id', user.id);

        if (userInfoError || !utilisateurs || utilisateurs.length === 0) {
          console.error("Aucun utilisateur trouvé");
          return;
        }

        const entreprise_id = utilisateurs[0].entreprise_id;
        setEntrepriseId(entreprise_id);

        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('entreprise_id', entreprise_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data);
      } catch (err) {
        console.error('Erreur lors du fetch des leads :', err);
      }
    };

    fetchLeads();
  }, []);

  const handleResize = (key, width) => {
    setColWidths((prev) => ({ ...prev, [key]: width }));
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddLead = async () => {
    if (!entrepriseId) return;
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    const newLead = {
      user_id: user.id,
      entreprise_id: entrepriseId,
      ...formData,
      source: formData.source === 'autre' ? customSource : formData.source
    };

    const { data, error } = await supabase.from('leads').insert([newLead]).select();
    if (error) return;

    setLeads([...(data || []), ...leads]);
    setFormData({
      prenom: '', nom: '', email_professionnel: '', telephone_professionnel: '',
      nom_entreprise: '', statut_client: '', source: '', notes: '', assigne_a: ''
    });
    setCustomSource('');
    setDrawerOpen(false);
  };

  return (
    <div className="leads-container">
      <div className="leads-header">
        <h1 className="leads-title">Tableau des Leads</h1>
        <button className="add-lead-btn" onClick={() => setDrawerOpen(true)}>Ajouter un prospect</button>
      </div>

      <div className="table-wrapper">
        <table className="lead-table">
          <thead>
            <tr>
              {selectedColumns.map((col) => (
                <ResizableTH key={col} columnKey={col} width={colWidths[col]} onResize={handleResize}>
                  {col}
                </ResizableTH>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                {selectedColumns.map((col) => (
                  <td key={col}>{lead[columnFieldMap[col]]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un nouveau prospect</h2>
            <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleInputChange} />
            <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleInputChange} />
            <input type="email" name="email_professionnel" placeholder="Email pro" value={formData.email_professionnel} onChange={handleInputChange} />
            <input type="text" name="telephone_professionnel" placeholder="Téléphone pro" value={formData.telephone_professionnel} onChange={handleInputChange} />
            <input type="text" name="nom_entreprise" placeholder="Entreprise" value={formData.nom_entreprise} onChange={handleInputChange} />
            <input type="text" name="statut_client" placeholder="Statut" value={formData.statut_client} onChange={handleInputChange} />
            <select name="source" value={formData.source} onChange={handleInputChange}>
              <option value="">-- Source --</option>
              <option value="bouche-à-bouche">Bouche-à-bouche</option>
              <option value="appel entrant">Appel entrant</option>
              <option value="autre">Autre (personnalisée)</option>
            </select>
            {formData.source === 'autre' && (
              <input type="text" placeholder="Source personnalisée" value={customSource} onChange={(e) => setCustomSource(e.target.value)} />
            )}
            <input type="text" name="assigne_a" placeholder="Assigné à" value={formData.assigne_a} onChange={handleInputChange} />
            <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} />
            <div className="drawer-buttons">
              <button onClick={handleAddLead}>Valider</button>
              <button className="cancel-btn" onClick={() => setDrawerOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
