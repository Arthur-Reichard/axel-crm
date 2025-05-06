import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/css/Leads.css';
import { supabase } from '../helper/supabaseClient';
import ResizableTH from './ResizableTH';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ColumnMapping from './ColumnMapping';
import FilterDrawer from '../components/FilterDrawer';
import { FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';
import { useMemo } from 'react';

const allColumns = [
  'Prénom', 'Nom', 'Email pro', 'Téléphone pro',
  'Entreprise', 'Statut', 'Assigné à'
];

const columnFieldMap = {
  'Prénom': 'prenom',
  'Nom': 'nom',
  'Email pro': 'email_professionnel',
  'Téléphone pro': 'telephone_professionnel',
  'Entreprise': (lead) => {
    if (lead.type_client === 'entreprise' && lead.entreprises_clients) {
      return lead.entreprises_clients.nom;
    }
    return lead.nom_entreprise;
  },
  'Statut': 'statut_client',
  'Assigné à': 'assigne_a',
  'Notes': 'notes'
};

export default function Leads() {
  const [availableFields, setAvailableFields] = useState([
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
  ]);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFields, setVisibleFields] = useState([]);

  const fullFieldList = useMemo(() => {
    const standardFields = availableFields.map(f => ({
      id: 'standard-' + f.name,
      nom_affichage: f.label,
      nom_champ: f.name,
      type: f.type || 'text',
      standard: true
    }));
    return [...standardFields, ...customFields];
  }, [availableFields, customFields]);

  const toggleVisibility = async (fieldName) => {
    const isVisible = visibleFields.includes(fieldName);
  
    const { error } = await supabase
      .from('champs_visibles')
      .upsert({
        entreprise_id: entrepriseId,
        nom_champ: fieldName,
        visible: !isVisible
      }, { onConflict: ['entreprise_id', 'nom_champ'] });         
  
    if (error) {
      console.error('Erreur mise à jour visibilité :', error);
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
  };
  

  const navigate = useNavigate();
  const allFieldsRef = useRef([]);

  const [selectedClientType, setSelectedClientType] = useState('individuel');
  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [entreprisesOnly, setEntreprisesOnly] = useState([]);
  const [colWidths, setColWidths] = useState({});
  const [step, setStep] = useState(1);
  const [parsedRows, setParsedRows] = useState([]);

  useEffect(() => {
    const savedType = localStorage.getItem('lastClientType');
    if (savedType === 'individuel' || savedType === 'entreprise') {
      setSelectedClientType(savedType);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('lastClientType', selectedClientType);
  }, [selectedClientType]);
  

  const [itemsPerPage, setItemsPerPage] = useState(25); // valeurs : 10, 25, 50, 100
  const [currentPage, setCurrentPage] = useState(1);
  const exportData = (format) => {
    if (!allLeads.length) {
      alert("Aucun lead à exporter !");
      return;
    }

    const exportFields = availableFields.map(field => field.name);
  
    const exportRows = allLeads.map(lead => {
      const row = {};
      exportFields.forEach(field => {
        row[field] = lead[field] ?? '';
      });
      return row;
    });
  
    if (format === 'csv') {
      const csv = Papa.unparse(exportRows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'prospects.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Prospects");
      XLSX.writeFile(workbook, "prospects.xlsx");
    }
  };
  

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
    assigne_a: '',
    type_client: 'individuel',
    client_entreprise_id: '',
    siren: ''
  });
  
  const [entreprisesClients, setEntreprisesClients] = useState([])

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterList, setFilterList] = useState([]);
  const [newField, setNewField] = useState({ nom_affichage: '', type: 'text' });

  const allFields = [...availableFields, ...customFields.map(f => ({
    label: f.nom_affichage,
    name: f.nom_champ,
    type: f.type
  }))];

  allFieldsRef.current = allFields;

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
        await fetchEntreprisesClients(entreprise_id);
  
        const { data: custom, error: customErr } = await supabase
          .from('champs_personnalises')
          .select('*')
          .eq('entreprise_id', entreprise_id);
  
        if (!customErr) setCustomFields(custom);
  
        const { data, error } = await supabase
          .from('leads')
          .select(`
            id, prenom, nom, type_client, nom_entreprise, statut_client, assigne_a,
            email_professionnel, telephone_professionnel, source, notes,
            entreprises_clients(id, nom)
          `)
          .eq('entreprise_id', entreprise_id)
          .order('created_at', { ascending: false });
  
      } catch (err) {
        console.error("Erreur fetchLeads :", err);
      }
    };
  
    const fetchEntreprisesClients = async (entrepriseId) => {
      const { data, error } = await supabase
        .from('entreprises_clients')
        .select('id, nom')
        .eq('entreprise_id', entrepriseId);
      
      if (!error) 
      setEntreprisesClients(data);
      setEntreprisesOnly(data);
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
      return allLeads
      .filter(lead => {
        const type = (lead.type_client || '').toLowerCase();
        if (selectedClientType === 'individuel') return type === 'individuel';
        if (selectedClientType === 'entreprise') return type === 'entreprise';
        return true;
      })      
        .filter(lead => {
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
  }, [filterList, allLeads, selectedClientType]);

  useEffect(() => {
    const fetchVisibility = async () => {
      if (!entrepriseId) return;
  
      const { data: visibles, error } = await supabase
        .from('champs_visibles')
        .select('nom_champ')
        .eq('entreprise_id', entrepriseId)
        .eq('visible', true);
  
      if (error) {
        console.error("Erreur chargement champs_visibles :", error);
        return;
      }
  
      const visibleNames = visibles.map(v => v.nom_champ);
      setVisibleFields(visibleNames);
    };
  
    fetchVisibility();
  }, [entrepriseId, customFields]);  

  useEffect(() => {
    const wasUpdated = localStorage.getItem('leadUpdated');
    if (wasUpdated === 'true') {
      setShowToast(true);
      localStorage.removeItem('leadUpdated');
      setTimeout(() => setShowToast(false), 3000);
    }
  }, []);
  
  useEffect(() => {
    const fetchUpdatedLeads = async () => {
      if (!entrepriseId) return;
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('entreprise_id', entrepriseId)
        .order('created_at', { ascending: false });
  
      if (!error) {
        setAllLeads(data);
        setLeads(data);
      }
    };
  
    fetchUpdatedLeads();
  }, [entrepriseId]);
  
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
  
    if (formData.type_client === 'entreprise') {
      // 👉 Crée uniquement l'entreprise dans entreprises_clients
      const { data: entrepriseCreee, error: errEntreprise } = await supabase
        .from('entreprises_clients')
        .insert([{
          nom: formData.nom_entreprise,
          entreprise_id: entrepriseId,
          created_by: user.id,
          siren: formData.siren || null
        }]);
  
      if (errEntreprise) {
        console.error("Erreur création entreprise :", errEntreprise.message);
        alert("Erreur lors de la création de l'entreprise");
        return;
      }
  
      alert("✅ Entreprise créée avec succès");
      setFormData({
        prenom: '',
        nom: '',
        email_professionnel: '',
        telephone_professionnel: '',
        nom_entreprise: '',
        statut_client: '',
        source: '',
        notes: '',
        assigne_a: '',
        type_client: 'individuel',
        client_entreprise_id: '',
        siren: ''
      });
      setDrawerOpen(false);
      setCustomSource('');
      return;
    }
  
    // 👉 Sinon (client individuel), crée un lead
    const newLead = {
      user_id: user.id,
      entreprise_id: entrepriseId,
      prenom: formData.prenom || '',
      nom: formData.nom || '',
      email_professionnel: formData.email_professionnel || '',
      telephone_professionnel: formData.telephone_professionnel || '',
      statut_client: formData.statut_client || '',
      source: formData.source === 'autre' ? customSource || '' : formData.source || '',
      notes: formData.notes || '',
      type_client: formData.type_client,
      client_entreprise_id: formData.client_entreprise_id || null,
      nom_entreprise: formData.nom_entreprise || '',
    };
  
    if (formData.assigne_a?.trim()) {
      newLead.assigne_a = formData.assigne_a.trim();
    }
  
    const { data, error } = await supabase.from('leads').insert([newLead]).select();
  
    if (error) {
      console.error("Erreur ajout lead :", error.message);
      alert("Erreur lors de l'ajout du prospect : " + error.message);
      return;
    }
  
    setLeads([...(data || []), ...leads]);
    setFormData({
      prenom: '',
      nom: '',
      email_professionnel: '',
      telephone_professionnel: '',
      nom_entreprise: '',
      statut_client: '',
      source: '',
      notes: '',
      assigne_a: '',
      type_client: 'individuel',
      client_entreprise_id: '',
      siren: ''
    });
    setCustomSource('');
    setDrawerOpen(false);
  };  
  

  const handleDeleteCustomField = async (id) => {
    if (!window.confirm("Supprimer ce champ personnalisé ?")) return;
  
    const { error } = await supabase
      .from('champs_personnalises')
      .delete()
      .eq('id', id);
  
    if (!error) {
      setCustomFields(prev => prev.filter(f => f.id !== id));
    } else {
      alert("Erreur lors de la suppression");
      console.error(error);
    }
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
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)));
      setSelectedLeads([]);
      setSelectAll(false);
    }
  };

  const exportButtonRef = useRef(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  return (
    <>
  {showToast && <div className="toast-success">✅ Lead mis à jour avec succès</div>}

    <div className="leads-container">
    <div className="leads-header">
      <div>
          <FilterDrawer
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            filters={filterList}
            setFilters={setFilterList}
            availableFields={availableFields}
          />
        {selectedLeads.length > 0 && (
          <button className="delete-btn" onClick={handleDeleteSelected}>Supprimer sélection</button>
        )}
      </div>
      </div>
      <div className="top-toolbar">
        <div className="left-toolbar">
          <div className="view-toggle">
            <button
              className={selectedClientType === 'individuel' ? 'active' : ''}
              onClick={() => {
                setSelectedClientType('individuel');
                setCurrentPage(1);
              }}
            >
              Individuels
            </button>
            <button
              className={selectedClientType === 'entreprise' ? 'active' : ''}
              onClick={() => {
                setSelectedClientType('entreprise');
                setCurrentPage(1);
              }}
            >
              Entreprises
            </button>
          </div>
          <button className="filter-btn" type="button" onClick={() => setFilterDrawerOpen(true)}>Filtrer</button>
        </div>

        <div className="right-toolbar">
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          <FiSettings size={20} />
        </button>
          <label className="import-btn">
            Importer
            <input type="file" accept=".csv, .xlsx" onChange={handleFileUpload} hidden />
          </label>
          <div className="export-btn-wrapper" ref={exportButtonRef}>
            <button className="export-btn" onClick={() => setShowExportMenu(prev => !prev)}>
              Exporter ▼
            </button>
            {showExportMenu && (
              <div className="export-menu">
                <button onClick={() => { exportData('csv'); setShowExportMenu(false); }}>Exporter en CSV</button>
                <button onClick={() => { exportData('excel'); setShowExportMenu(false); }}>Exporter en Excel</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrapper">
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
    {selectedClientType === 'entreprise'
      ? entreprisesOnly.slice(start, end).map(ent => (
          <tr
            key={ent.id}
            onClick={() => navigate(`/entreprises-clients/${ent.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <td></td>
            <td colSpan={selectedColumns.length}>
              <strong>{ent.nom}</strong>
            </td>
          </tr>
        ))
  : paginatedLeads.map(lead => (
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
            {typeof columnFieldMap[col] === 'function'
              ? columnFieldMap[col](lead)
              : lead[columnFieldMap[col]]}
          </td>
        ))}
      </tr>
))}
    </tbody>
    <tfoot>
      <tr className="pagination-info-row">
        <td colSpan={selectedColumns.length + 1}>
          <div className="pagination-inline">
            <span>
            <em>
              {selectedClientType === 'entreprise' ? (
                <>
                  Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, entreprisesOnly.length)} –{' '}
                  {Math.min(currentPage * itemsPerPage, entreprisesOnly.length)} sur {entreprisesOnly.length} entreprises
                </>
              ) : (
                <>
                  Affichage {Math.min((currentPage - 1) * itemsPerPage + 1, leads.length)} –{' '}
                  {Math.min(currentPage * itemsPerPage, leads.length)} sur {leads.length} prospects
                </>
              )}
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
    </tfoot>
  </table>
  <button className="add-prospect-fab" type="button" onClick={() => setDrawerOpen(true)}>+</button>
</div>



        {drawerOpen && (
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <h2>Créer un nouveau contact</h2>

              <select name="type_client" value={formData.type_client} onChange={handleInputChange}>
                <option value="individuel">Client individuel</option>
                <option value="entreprise">Client entreprise</option>
              </select>

              {formData.type_client === 'individuel' && (
                <>
                  <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleInputChange} />
                  <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleInputChange} />
                  <input type="text" name="statut_client" placeholder="Statut" value={formData.statut_client} onChange={handleInputChange} />
                  <input type="text" name="assigne_a" placeholder="Assigné à" value={formData.assigne_a} onChange={handleInputChange} />
                  
                  <select name="client_entreprise_id" value={formData.client_entreprise_id} onChange={handleInputChange}>
                    <option value="">-- Sélectionner une entreprise --</option>
                    {entreprisesClients.map(ec => (
                      <option key={ec.id} value={ec.id}>{ec.nom}</option>
                    ))}
                  </select>
                </>
              )}

              {formData.type_client === 'entreprise' && (
                <>
                  <input type="text" name="nom_entreprise" placeholder="Nom de l'entreprise" value={formData.nom_entreprise} onChange={handleInputChange} />
                  <input type="text" name="siren" placeholder="SIREN" value={formData.siren} onChange={handleInputChange} />
                </>
              )}

              <select name="source" value={formData.source} onChange={handleInputChange}>
                <option value="">-- Source --</option>
                <option value="bouche-à-bouche">Bouche à oreille</option>
                <option value="appel entrant">Appel entrant</option>
                <option value="autre">Autre (personnalisée)</option>
              </select>

              {formData.source === 'autre' && (
                <input type="text" placeholder="Source personnalisée" value={customSource} onChange={(e) => setCustomSource(e.target.value)} />
              )}

              <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} />

              <div className="drawer-buttons">
                <button onClick={handleAddLead}>Valider</button>
                <button className="cancel-btn" onClick={() => setDrawerOpen(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="drawer-overlay" onClick={() => setSettingsOpen(false)}>
            <div className="drawer" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: '1rem' }}>Champs personnalisés</h2>

              <div style={{ marginBottom: '2rem' }}>
                {customFields.length === 0 ? (
                  <p>Aucun champ personnalisé pour l’instant.</p>
                ) : (
                  <ul className="custom-field-list">
                    {customFields.map(field => (
                      <li className="custom-field-item" key={field.id}>
                        <span>{field.nom_affichage}<small> ({field.type})</small></span>
                        <button onClick={() => handleDeleteCustomField(field.id)}>✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                type="text"
                placeholder="Nom du champ"
                value={newField.nom_affichage}
                onChange={e => setNewField({ ...newField, nom_affichage: e.target.value })}
              />
              <select
                value={newField.type}
                onChange={e => setNewField({ ...newField, type: e.target.value })}
                style={{ marginBottom: '1.5rem' }}
              >
                <option value="text">Texte</option>
                <option value="textarea">Texte long</option>
                <option value="date">Date</option>
              </select>

              <div className="drawer-buttons">
                <button onClick={async () => {                 
                  if (!entrepriseId || !newField.nom_affichage) return;
                  const nom_champ = 'champ_' + Date.now();

                  const { data, error } = await supabase
                    .from('champs_personnalises')
                    .insert([{
                      entreprise_id: entrepriseId,
                      nom_affichage: newField.nom_affichage,
                      nom_champ,
                      type: newField.type
                    }])
                    .select();
                  
                  if (!error && data && data.length > 0) {
                    const nouveauChamp = data[0];
                  
                    // ⬇️ On ajoute aussi sa visibilité par défaut
                    const { error: visErr } = await supabase.from('champs_visibles').insert([{
                      entreprise_id: entrepriseId,
                      nom_champ: nouveauChamp.nom_champ,
                      visible: true
                    }]);                  
                  
                    if (visErr) {
                      console.error("Erreur insertion champs_visibles :", visErr.message);
                    }
                  
                    setCustomFields([...customFields, nouveauChamp]);
                    setNewField({ nom_affichage: '', type: 'text' });
                  }                                              
                }}>
                  Ajouter
                </button>
                <button className="cancel-btn" onClick={() => setSettingsOpen(false)}>Fermer</button>
              </div>

              {fullFieldList.map(field => (
  <li key={field.nom_champ} className="custom-field-item">
    <span>{field.nom_affichage}</span>
    
    {/* Bouton œil pour (dé)masquer */}
    <button onClick={() => toggleVisibility(field.nom_champ)}>
      {visibleFields.includes(field.nom_champ) ? <FiEye /> : <FiEyeOff />}
    </button>

    {/* Supprimer seulement si ce n'est pas un champ standard */}
    {!field.standard && (
      <button onClick={() => handleDeleteCustomField(field.id)}>✕</button>
    )}
  </li>
))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
