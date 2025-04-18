import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/css/Leads.css';
import { supabase } from '../helper/supabaseClient';
import ResizableTH from './ResizableTH';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ColumnMapping from './ColumnMapping';
import FilterDrawer from '../components/FilterDrawer';

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
  const [showToast, setShowToast] = useState(false);
  const [step, setStep] = useState(1);
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [allLeads, setAllLeads] = useState([]);
  const [filterList, setFilterList] = useState([]);
  const availableFields = [
    { label: "Nom", name: "nom" },
    { label: "Prénom", name: "prenom" },
    { label: "Email", name: "email_professionnel" },
    { label: "Téléphone", name: "telephone_professionnel" },
    { label: "Entreprise", name: "nom_entreprise" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Date de naissance", name: "date_naissance", type: "date" },
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
  const [itemsPerPage, setItemsPerPage] = useState(25); // valeurs : 10, 25, 50, 100
  const [currentPage, setCurrentPage] = useState(1);
  

  const [selectedColumns, setSelectedColumns] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('selectedColumns'));
    return Array.isArray(stored) ? stored.filter(col => allColumns.includes(col)) : allColumns;
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
        setAllLeads(data);
        setLeads(data);
      } catch (err) {
        console.error('Erreur lors du fetch des leads :', err);
      }
    };

    fetchLeads();
  }, []);

  const [paginatedLeads, setPaginatedLeads] = useState([]);

  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setPaginatedLeads(leads.slice(start, end));
  }, [leads, currentPage, itemsPerPage]);

  useEffect(() => {
    const applyFilters = () => {
      return allLeads.filter(lead => {
        return filterList.every(({ field, operator, value }) => {
          const v = (lead[field.name] || '').toString().toLowerCase();
          const s = (value || '').toLowerCase();
  
          switch (operator) {
            case 'contains': return v.includes(s);
            case 'not_contains': return !v.includes(s);
            case 'equals': return v === s;
            case 'not_equals': return v !== s;
            case 'empty': return v === '';
            case 'not_empty': return v !== '';
            default: return true;
          }
        });
      });
    };
  
    setLeads(applyFilters());
  }, [filterList, allLeads]);

  useEffect(() => {
    const wasUpdated = localStorage.getItem('leadUpdated');
    if (wasUpdated === 'true') {
      setShowToast(true);
      localStorage.removeItem('leadUpdated');
      setTimeout(() => setShowToast(false), 3000);
    }
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
      prenom: formData.prenom || '',
      nom: formData.nom || '',
      email_professionnel: formData.email_professionnel || '',
      telephone_professionnel: formData.telephone_professionnel || '',
      nom_entreprise: formData.nom_entreprise || '',
      statut_client: formData.statut_client || '',
      source: formData.source === 'autre' ? customSource || '' : formData.source || '',
      notes: formData.notes || ''
    };

    if (formData.assigne_a && formData.assigne_a.trim() !== '') {
      newLead.assigne_a = formData.assigne_a.trim();
    }

    const { data, error } = await supabase.from('leads').insert([newLead]).select();

    if (error) {
      console.error("Erreur Supabase :", error.message);
      alert("Erreur lors de l'ajout du prospect : " + error.message);
      return;
    }

    setLeads([...(data || []), ...leads]);
    setFormData({
      prenom: '', nom: '', email_professionnel: '', telephone_professionnel: '',
      nom_entreprise: '', statut_client: '', source: '', notes: '', assigne_a: ''
    });
    setCustomSource('');
    setDrawerOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const parseData = (rawData) => {
      const headers = Object.keys(rawData[0] || {});
      navigate('/column-mapping', {
        state: {
          headers,
          parsedRows: rawData
        }
      });
    };
  
    const reader = new FileReader();
  
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => parseData(results.data)
      });
    } else if (file.name.endsWith('.xlsx')) {
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          blankrows: false
        }).filter(row =>
          Object.values(row).some(cell => cell && cell.toString().trim() !== '')
        );
        parseData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Format non supporté');
    }
  };
  

  const handleMappingComplete = async (mapping) => {
    console.log('parsedRows:', parsedRows.length);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !entrepriseId) return;

    const leadsToInsert = parsedRows.map(row => {
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

    const { error } = await supabase.from('leads').insert(leadsToInsert);
    if (error) {
      console.error('Erreur insertion leads :', error);
      alert('Erreur lors de l’import');
    } else {
      setLeads([...leadsToInsert, ...leads]);
      setStep(1);
      alert('Import réussi ✅');
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedLeads.length) return;
    if (!window.confirm(`Supprimer définitivement ${selectedLeads.length} prospect(s) ?`)) return;

    const { data, error } = await supabase.from('leads').delete().in('id', selectedLeads);

    if (error) {
      console.error('Erreur lors de la suppression :', error.message, error.details);
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      console.log('Supprimés :', data);
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      setSelectAll(false);
    }
  };

  return (
    <>
  {showToast && <div className="toast-success">✅ Lead mis à jour avec succès</div>}

    <div className="leads-container">
    <div className="leads-header">
      <h1 className="leads-title">Tableau des Leads</h1>
      <div style={{ display: 'flex', gap: '1rem' }}>
      <button className="filter-btn" type="button" onClick={() => setFilterDrawerOpen(true)}>Filtrer</button>
          <FilterDrawer
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            filters={filterList}
            setFilters={setFilterList}
            availableFields={availableFields}
          />
          <button className="add-lead-btn" type="button" onClick={() => setDrawerOpen(true)}>Ajouter un prospect</button>
        <label className="import-btn">
          Importer
          <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} hidden />
        </label>
        {selectedLeads.length > 0 && (
          <button className="delete-btn" onClick={handleDeleteSelected}>Supprimer sélection</button>
        )}
      </div>
    </div>

      <div className="table-wrapper">
            <tr className="pagination-info-row">
        <td colSpan={selectedColumns.length + 1}>
          <div className="pagination-inline">
            <span>
              <em>
                Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, leads.length)} –
                {Math.min(currentPage * itemsPerPage, leads.length)} sur {leads.length} prospects
              </em>
            </span>

            <div className="pagination-nav">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>←</button>
              <button disabled={currentPage * itemsPerPage >= leads.length} onClick={() => setCurrentPage(prev => prev + 1)}>→</button>
              <select value={itemsPerPage} onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}>
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
            </div>
          </div>
        </td>
      </tr>
        <table className="lead-table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
              {selectedColumns.map((col) => (
                <ResizableTH key={col} columnKey={col} width={colWidths[col]} onResize={handleResize}>
                  {col}
                </ResizableTH>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleSelectLead(lead.id)}
                  />
                </td>
                {selectedColumns.map((col) => (
                  <td key={col} onClick={() => navigate(`/leads/${lead.id}`)} style={{ cursor: 'pointer' }}>
                    {lead[columnFieldMap[col]]}
                  </td>
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
    </>
  );
}
