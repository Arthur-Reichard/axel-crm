import React, { useEffect, useState } from 'react';
import {
  getMaterielsByEntreprise,
  createMateriel,
} from '../services/materielsService';
import './css/ParcMateriel.css';
import { supabase } from '../helper/supabaseClient';
const materielData = { ...formData, entreprise_id: entrepriseId };
console.log("FormData envoyé à Supabase:", materielData);
await createMateriel(materielData);*

const ParcMateriel = () => {
  const [materiels, setMateriels] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    type: '',
    statut: 'En service',
    localisation: '',
    date_acquisition: '',
    numero_serie: '',
    remarques: '',
  });

  const entrepriseId = localStorage.getItem('entrepriseId') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMaterielsByEntreprise(entrepriseId);
        setMateriels(data);
      } catch (error) {
        console.error('Erreur de chargement du parc matériel', error);
      }
    };
    if (entrepriseId) fetchData();
  }, [entrepriseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMateriel({ ...formData, entreprise_id: entrepriseId });
      setDrawerOpen(false);
      setFormData({ nom: '', type: '', statut: 'En service', localisation: '', date_acquisition: '', numero_serie: '', remarques: '' });
      const data = await getMaterielsByEntreprise(entrepriseId);
      setMateriels(data);
    } catch (error) {
      console.error('Erreur de création du matériel', error);
    }
  };

  return (
    <div className="materiel-container">
      <div className="materiel-header">
        <h2>Parc Matériel</h2>
        <button onClick={() => setDrawerOpen(true)} className="add-button">+ Ajouter un matériel</button>
      </div>

      <table className="materiel-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Localisation</th>
            <th>Date d’acquisition</th>
          </tr>
        </thead>
        <tbody>
          {materiels.map((m) => (
            <tr key={m.id}>
              <td>{m.nom}</td>
              <td>{m.type}</td>
              <td>{m.statut}</td>
              <td>{m.localisation}</td>
              <td>{m.date_acquisition}</td>
            </tr>
          ))}
        </tbody>
      </table>

    {drawerOpen && (
        <div className="drawer-overlay">
            <div className="drawer">
            <form onSubmit={handleCreate}>
                <h2>Ajouter un matériel</h2>

                <div className="lead-field">
                <label>Nom</label>
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
                </div>

                <div className="lead-field">
                <label>Type</label>
                <input type="text" name="type" value={formData.type} onChange={handleChange} required />
                </div>

                <div className="lead-field">
                <label>Statut</label>
                <select name="statut" value={formData.statut} onChange={handleChange}>
                    <option>En service</option>
                    <option>En maintenance</option>
                    <option>Hors service</option>
                </select>
                </div>

                <div className="lead-field">
                <label>Localisation</label>
                <input type="text" name="localisation" value={formData.localisation} onChange={handleChange} />
                </div>

                <div className="lead-field">
                <label>Date d’acquisition</label>
                <input type="date" name="date_acquisition" value={formData.date_acquisition} onChange={handleChange} />
                </div>

                <div className="lead-field">
                <label>Numéro de série</label>
                <input type="text" name="numero_serie" value={formData.numero_serie} onChange={handleChange} />
                </div>

                <div className="lead-field">
                <label>Remarques</label>
                <textarea name="remarques" value={formData.remarques} onChange={handleChange} />
                </div>

                <div className="drawer-buttons">
                <button type="submit">Ajouter</button>
                <button type="button" className="cancel-btn" onClick={() => setDrawerOpen(false)}>Annuler</button>
                </div>
            </form>
            </div>
        </div>
        )}

    </div>
  );
};

export default ParcMateriel;
