import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import DashboardNavbar from "./DashboardNavbar";
import "../pages/css/Factures.css";
import { PDFViewer } from '@react-pdf/renderer';
import FacturePDF from '../components/FacturePDF';

const FactureView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [utilisateur, setUtilisateur] = useState(null);
  const [modifie, setModifie] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let userData = null;
      if (user?.id) {
        const { data } = await supabase.from("utilisateurs").select("*").eq("id", user.id).single();
        userData = data;
        setUtilisateur(data);
      }

      const { data: factureData } = await supabase.from("factures").select("*").eq("id", id).single();
      if (factureData) {
        const completeData = {
          ...factureData,
          emetteur_nom: factureData.emetteur_nom || `${userData?.prenom || ''} ${userData?.nom || ''}`.trim(),
          emetteur_email: factureData.emetteur_email || userData?.email || '',
          emetteur_telephone: factureData.emetteur_telephone || userData?.phone || '',
          emetteur_adresse: factureData.emetteur_adresse || userData?.adresse || '',
        };
        setFormData(completeData);
        setOriginalData(completeData);
      }
    };
    fetchAll();
  }, [id]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      setModifie(JSON.stringify(updated) !== JSON.stringify(originalData));
      return updated;
    });
  };

  const total_ht = formData?.lignes?.reduce((sum, ligne) => {
    return sum + (parseFloat(ligne.prix_unitaire || 0) * parseFloat(ligne.quantite || 0));
  }, 0).toFixed(2);

  const total_ttc = (parseFloat(total_ht || 0) * (1 + (formData?.tva || 0) / 100)).toFixed(2);

  const handleBack = () => {
    if (modifie && !window.confirm("Vous avez des modifications non enregistrées. Quitter quand même ?")) {
      return;
    }
    navigate("/factures");
  };

  const handleSave = async () => {
    if (!modifie) return;
    if (!window.confirm("Êtes-vous sûr de vouloir enregistrer les modifications ?")) return;

    const { id: _, ...toSave } = formData;

    const { error } = await supabase.from("factures").update(toSave).eq("id", id);
    if (!error) {
      alert("Modifications enregistrées.");
      setOriginalData(formData);
      setModifie(false);
    } else {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  if (!formData) return <p>Chargement...</p>;

  return (
    <div className="facture-page">
      <DashboardNavbar />
      <div className="facture-popup">
        <div className="popup-left">
          <h2>Édition de la facture</h2>

          {[
            "numero", "reference_client", "client", "adresse_facturation", "date_facture",
            "objet", "tva", "notes", "emetteur_nom", "emetteur_email", "emetteur_telephone", "emetteur_adresse"
          ].map((field, i) => (
            <div key={i} className="form-field">
              <label>{field.replace(/_/g, ' ')}</label>
              <input
                type={field.includes("date") ? "date" : "text"}
                value={formData[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
              />
            </div>
          ))}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={handleBack}>← Retour</button>
            <button onClick={handleSave} disabled={!modifie}>
              Enregistrer les modifications
            </button>
          </div>
        </div>
        <div className="popup-right">
          <PDFViewer style={{ width: '100%', height: '100%' }}>
            <FacturePDF formData={{ ...formData, total_ht }} total_ttc={total_ttc} utilisateur={utilisateur} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

export default FactureView;
