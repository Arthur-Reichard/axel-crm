import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/css/Leads.css';
import supabase from '../helper/supabaseClient';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ResizableTH from './ResizableTH';

function ColumnDrawer({ columns, selectedColumns, onClose, onUpdate }) {
  const [localCols, setLocalCols] = useState([]);

  useEffect(() => {
    setLocalCols(columns);
  }, [columns]);

  const handleToggle = (column) => {
    if (selectedColumns.includes(column)) {
      onUpdate(selectedColumns.filter((col) => col !== column));
    } else {
      onUpdate([...selectedColumns, column]);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(localCols);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onUpdate(reordered);
    localStorage.setItem('selectedColumns', JSON.stringify(reordered));
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <h2>Colonnes du tableau</h2>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {localCols.map((col, index) => (
                  <Draggable key={col} draggableId={col} index={index}>
                    {(provided) => (
                      <div
                        className="drag-item"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedColumns.includes(col)}
                            onChange={() => handleToggle(col)}
                          />
                          {col}
                        </label>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="drawer-buttons">
          <button onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customSource, setCustomSource] = useState('');
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [colWidths, setColWidths] = useState({});
  const navigate = useNavigate();

  const allColumns = ['Prénom', 'Nom', 'Email pro', 'Téléphone pro', 'Entreprise', 'Statut', 'Source', 'Assigné à'];
  const [selectedColumns, setSelectedColumns] = useState(() => {
    return JSON.parse(localStorage.getItem('selectedColumns')) || allColumns;
  });

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email_professionnel: '',
    telephone_professionnel: '',
    nom_entreprise: '',
    statut_client: '',
    source: '',
    notes: ''
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const {
          data: { user }, error: userError
        } = await supabase.auth.getUser();

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
    console.log("Tentative ajout lead");
    if (!entrepriseId) {
      console.error("Pas d'entreprise ID, impossible de créer un lead.");
      return;
    }

    const {
      data: { user }, error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Utilisateur non authentifié");
      return;
    }

    const newLead = {
      user_id: user.id,
      entreprise_id: entrepriseId,
      prenom: formData.prenom,
      nom: formData.nom,
      email_professionnel: formData.email_professionnel,
      telephone_professionnel: formData.telephone_professionnel,
      nom_entreprise: formData.nom_entreprise,
      statut_client: formData.statut_client,
      source: formData.source === 'autre' ? customSource : formData.source,
      notes: formData.notes,
    };

    const { data, error } = await supabase.from('leads').insert([newLead]).select();

    if (error) {
      console.error("Erreur d'ajout du lead :", error);
      return;
    }

    console.log("Lead ajouté avec succès :", data);
    setLeads([...(data || []), ...leads]);
    setFormData({
      prenom: '', nom: '', email_professionnel: '', telephone_professionnel: '',
      nom_entreprise: '', statut_client: '', source: '', notes: ''
    });
    setCustomSource('');
    setDrawerOpen(false);
  };

  return (
    <div className="leads-container">
      <div className="leads-header">
        <h1 className="leads-title">Tableau des Leads</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="add-lead-btn" onClick={() => setDrawerOpen(true)}>Ajouter un prospect</button>
          <button className="add-lead-btn" onClick={() => setConfigDrawerOpen(true)}>Modifier les colonnes</button>
        </div>
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
                {selectedColumns.includes('Prénom') && <td>{lead.prenom}</td>}
                {selectedColumns.includes('Nom') && <td>{lead.nom}</td>}
                {selectedColumns.includes('Email pro') && <td>{lead.email_professionnel}</td>}
                {selectedColumns.includes('Téléphone pro') && <td>{lead.telephone_professionnel}</td>}
                {selectedColumns.includes('Entreprise') && <td>{lead.nom_entreprise}</td>}
                {selectedColumns.includes('Statut') && <td>{lead.statut_client}</td>}
                {selectedColumns.includes('Source') && <td>{lead.source}</td>}
                {selectedColumns.includes('Assigné à') && <td>{lead.assigne_a}</td>}
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
            <textarea name="notes" placeholder="Notes" value={formData.notes} onChange={handleInputChange} />
            <div className="drawer-buttons">
              <button onClick={handleAddLead}>Valider</button>
              <button className="cancel-btn" onClick={() => setDrawerOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {configDrawerOpen && (
        <ColumnDrawer
          columns={allColumns}
          selectedColumns={selectedColumns}
          onUpdate={setSelectedColumns}
          onClose={() => setConfigDrawerOpen(false)}
        />
      )}
    </div>
  );
}
