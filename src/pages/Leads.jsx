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

  const allColumns = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Entreprise', 'Adresse', 'Ville', 'Source', 'Description', 'Dernières actions'];
  const [selectedColumns, setSelectedColumns] = useState(() => {
    return JSON.parse(localStorage.getItem('selectedColumns')) || allColumns;
  });

  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', phone: '', company: '', adresse: '', ville: '', source: '', description: '', notes: ''
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const {
          data: { user }, error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) throw userError;

        const { data: utilisateur, error: userInfoError } = await supabase
          .from('utilisateurs')
          .select('entreprise_id')
          .eq('id', user.id)
          .single();

        if (userInfoError) throw userInfoError;

        setEntrepriseId(utilisateur.entreprise_id);

        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('entreprise_id', utilisateur.entreprise_id)
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

    const {
      data: { user }, error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const newLead = {
      user_id: user.id,
      entreprise_id: entrepriseId,
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      adresse: formData.adresse,
      ville: formData.ville,
      source: formData.source === 'autre' ? customSource : formData.source,
      description: formData.description,
      notes: formData.notes,
    };

    const { data, error } = await supabase.from('leads').insert([newLead]).select();

    if (!error && data && data.length > 0) {
      setLeads([data[0], ...leads]);
      setFormData({ nom: '', prenom: '', email: '', phone: '', company: '', adresse: '', ville: '', source: '', description: '', notes: '' });
      setCustomSource('');
      setDrawerOpen(false);
    }
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
                {selectedColumns.includes('Nom') && <td>{lead.nom}</td>}
                {selectedColumns.includes('Prénom') && <td>{lead.prenom}</td>}
                {selectedColumns.includes('Email') && <td>{lead.email}</td>}
                {selectedColumns.includes('Téléphone') && <td>{lead.phone}</td>}
                {selectedColumns.includes('Entreprise') && <td>{lead.company}</td>}
                {selectedColumns.includes('Adresse') && <td>{lead.adresse}</td>}
                {selectedColumns.includes('Ville') && <td>{lead.ville}</td>}
                {selectedColumns.includes('Source') && <td>{lead.source}</td>}
                {selectedColumns.includes('Description') && <td>{lead.description}</td>}
                {selectedColumns.includes('Dernières actions') && <td>{lead.notes}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un nouveau prospect</h2>
            <input type="text" name="nom" placeholder="Nom" value={formData.nom} onChange={handleInputChange} />
            <input type="text" name="prenom" placeholder="Prénom" value={formData.prenom} onChange={handleInputChange} />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
            <input type="text" name="phone" placeholder="Téléphone" value={formData.phone} onChange={handleInputChange} />
            <input type="text" name="company" placeholder="Entreprise" value={formData.company} onChange={handleInputChange} />
            <input type="text" name="adresse" placeholder="Adresse" value={formData.adresse} onChange={handleInputChange} />
            <input type="text" name="ville" placeholder="Ville" value={formData.ville} onChange={handleInputChange} />
            <select name="source" value={formData.source} onChange={handleInputChange}>
              <option value="">-- Source --</option>
              <option value="bouche-à-bouche">Bouche-à-bouche</option>
              <option value="appel entrant">Appel entrant</option>
              <option value="autre">Autre (personnalisée)</option>
            </select>
            {formData.source === 'autre' && (
              <input type="text" placeholder="Source personnalisée" value={customSource} onChange={(e) => setCustomSource(e.target.value)} />
            )}
            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} />
            <textarea name="notes" placeholder="Dernières actions" value={formData.notes} onChange={handleInputChange} />
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
