import React, { useEffect, useState } from 'react';
import '../pages/css/Leads.css';
import supabase from '../helper/supabaseClient';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    status: 'Nouveau',
    source: '',
    notes: '',
  });

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const {
          data: { user },
          error: userError,
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

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddLead = async () => {
    if (!entrepriseId) {
      console.warn("Pas d'entreprise ID");
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('Utilisateur non connecté');
      return;
    }

    const newLead = {
      user_id: user.id,
      entreprise_id: entrepriseId,
      name: formData.name,
      email: formData.email,
      company: formData.company,
      status: formData.status,
      source: formData.source,
      notes: formData.notes,
    };

    const { data, error } = await supabase.from('leads').insert([newLead]).select();

    if (error) {
      console.error('Erreur Supabase :', error);
      alert("Erreur lors de l’ajout du lead : " + error.message);
      return;
    }

    if (data && data.length > 0) {
      setLeads([data[0], ...leads]);
      setFormData({
        name: '',
        email: '',
        company: '',
        status: 'Nouveau',
        source: '',
        notes: ''
      });
      setDrawerOpen(false); // Ferme le drawer
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Erreur suppression lead :', error);
    } else {
      setLeads((prev) => prev.filter((lead) => lead.id !== id));
    }
  };

  return (
    <div className="leads-container">
      <div className="leads-header">
        <h1 className="leads-title">Tableau des Leads</h1>
        <button className="add-lead-btn" onClick={() => setDrawerOpen(true)}>
          Ajouter un prospect
        </button>
      </div>

      <table className="lead-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Entreprise</th>
            <th>Statut</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>
              <td>{lead.email}</td>
              <td>{lead.company}</td>
              <td>{lead.status}</td>
              <td>{lead.source}</td>
              <td>
                <button onClick={() => handleDelete(lead.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Créer un nouveau prospect</h2>
            <input type="text" name="name" placeholder="Nom" value={formData.name} onChange={handleInputChange} />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
            <input type="text" name="company" placeholder="Entreprise" value={formData.company} onChange={handleInputChange} />
            <input type="text" name="source" placeholder="Source" value={formData.source} onChange={handleInputChange} />
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
