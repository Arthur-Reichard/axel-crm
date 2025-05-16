import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import DashboardNavbar from "./DashboardNavbar";
import "../pages/css/Factures.css";
import { PDFViewer } from '@react-pdf/renderer';
import FacturePDF from '../components/FacturePDF';

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [numeroExistant, setNumeroExistant] = useState(false);
  const [utilisateur, setUtilisateur] = useState(null);
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [formData, setFormData] = useState({
    numero: "",
    reference_client: "",
    client: "",
    adresse_facturation: "",
    date_facture: new Date().toISOString().split("T")[0],
    objet: "",
    lignes: [],
    remise: 0,
    tva: 20,
    notes: "",
    emetteur_nom: "",
    emetteur_email: "",
    emetteur_telephone: "",
    emetteur_adresse: ""
  });

  useEffect(() => {
    const fetchUtilisateurEtDerniereFacture = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) return;

      const { data: utilisateurData } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", user.id)
        .single();

      setUtilisateur(utilisateurData);

      const { data: factures } = await supabase
        .from("factures")
        .select("emetteur_nom, emetteur_email, emetteur_telephone, emetteur_adresse")
        .eq("cree_par", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const derniere = factures?.[0] || null;

      setFormData((prev) => ({
        ...prev,
        emetteur_nom: derniere?.emetteur_nom || `${utilisateurData?.prenom || ''} ${utilisateurData?.nom || ''}`.trim(),
        emetteur_email: derniere?.emetteur_email || utilisateurData?.email || '',
        emetteur_telephone: derniere?.emetteur_telephone || utilisateurData?.phone || '',
        emetteur_adresse: derniere?.emetteur_adresse || utilisateurData?.adresse || '',
      }));
    };

    fetchUtilisateurEtDerniereFacture();
  }, []);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (!error) setLeads(data);
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      const lead = leads.find((l) => l.id === selectedLeadId);
      if (lead) {
        setFormData((prev) => ({
          ...prev,
          client: `${lead.prenom} ${lead.nom}`,
          adresse_facturation: lead.adresse || "",
          reference_client: lead.email || ""
        }));
      }
    }
  }, [selectedLeadId]);

  useEffect(() => {
    const checkNumero = async () => {
      if (!formData.numero) return;
      const { data } = await supabase
        .from("factures")
        .select("id")
        .eq("numero", formData.numero);
      setNumeroExistant(data && data.length > 0);
    };
    checkNumero();
  }, [formData.numero]);

  const total_ht = formData.lignes.reduce((sum, ligne) => {
    return sum + (parseFloat(ligne.prix_unitaire || 0) * parseFloat(ligne.quantite || 0));
  }, 0).toFixed(2);

  const total_ttc = (parseFloat(total_ht || 0) * (1 + formData.tva / 100)).toFixed(2);

  const handleChange = (field, value) => {
    setModifie(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddLigne = () => {
    setModifie(true);
    setFormData((prev) => ({
      ...prev,
      lignes: [...prev.lignes, { designation: "", quantite: 1, prix_unitaire: 0 }]
    }));
  };

  const handleRemoveLigne = (index) => {
    setModifie(true);
    const updated = formData.lignes.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, lignes: updated }));
  };

  const handleLigneChange = (index, field, value) => {
    setModifie(true);
    const newLignes = [...formData.lignes];
    newLignes[index][field] = field === 'designation' ? value : parseFloat(value);
    setFormData((prev) => ({ ...prev, lignes: newLignes }));
  };

  const handleSave = async () => {
    if (!formData.numero || numeroExistant) {
      alert("Numéro de facture invalide ou déjà utilisé.");
      return;
    }

    const {
      numero,
      reference_client,
      adresse_facturation,
      date_facture,
      objet,
      lignes,
      remise,
      tva,
      notes,
      emetteur_nom,
      emetteur_email,
      emetteur_telephone,
      emetteur_adresse
    } = formData;

    const { data: { user } } = await supabase.auth.getUser();

    const dataToInsert = {
      numero,
      reference_client,
      adresse_facturation,
      date_facture,
      objet,
      lignes,
      remise,
      tva,
      notes,
      emetteur_nom,
      emetteur_email,
      emetteur_telephone,
      emetteur_adresse,
      total_ht,
      total_ttc,
      client_id: selectedLeadId || null,
      entreprise_id: utilisateur?.entreprise_id || null,
      cree_par: user.id,
      statut: "brouillon"
    };

    const { error } = await supabase.from("factures").insert(dataToInsert);

    if (error) {
      console.error("Erreur création :", error);
      alert("Erreur lors de la création");
    } else {
      alert("Facture enregistrée !");
      navigate("/factures");
    }
  };

  const handleRetour = () => {
    if (modifie) {
      setShowConfirmToast(true);
    } else {
      navigate("/factures");
    }
  };

  const confirmerQuitter = () => {
    navigate("/factures");
  };

  const annulerQuitter = () => {
    setShowConfirmToast(false);
  };

  return (
    <div className="facture-page">
      <DashboardNavbar />
      <button className="retour-btn" onClick={handleRetour}>← Retour</button>

      {showConfirmToast && (
        <div className="toast-confirm">
          <h4>Voulez-vous vraiment quitter la création ?</h4>
          <div className="toast-confirm-buttons">
            <button className="cancel-btn" onClick={annulerQuitter}>Annuler</button>
            <button className="confirm-btn" onClick={confirmerQuitter}>Oui, quitter</button>
          </div>
        </div>
      )}

      <div className="facture-popup">
        <div className="popup-left">
          <h2>Nouvelle facture</h2>

          {[{
            label: "Prospect lié (optionnel)", type: "select", field: "selectedLeadId",
            options: leads.map(lead => ({ value: lead.id, label: `${lead.prenom} ${lead.nom}` }))
          },
            { label: "Numéro de facture", field: "numero" },
            { label: "Client", field: "client" },
            { label: "Adresse de facturation", field: "adresse_facturation" },
            { label: "Date de la facture", field: "date_facture", type: "date" },
            { label: "Objet", field: "objet" },
            { label: "Réf. client", field: "reference_client" },
            { label: "TVA (%)", field: "tva", type: "number" },
            { label: "Notes complémentaires", field: "notes" },
            { label: "Nom émetteur", field: "emetteur_nom" },
            { label: "Email émetteur", field: "emetteur_email" },
            { label: "Téléphone émetteur", field: "emetteur_telephone" },
            { label: "Adresse émetteur", field: "emetteur_adresse" },
          ].map((input, i) => (
            <div key={i} className="form-field">
              <label>{input.label}</label>
              {input.type === "select" ? (
                <select
                  className="custom-select"
                  value={input.field === "selectedLeadId" ? selectedLeadId : formData[input.field]}
                  onChange={(e) => {
                    if (input.field === "selectedLeadId") setSelectedLeadId(e.target.value);
                    else handleChange(input.field, e.target.value);
                  }}
                >
                  {input.options.map((opt, j) => (
                    <option key={j} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={input.type || "text"}
                  value={formData[input.field]}
                  onChange={(e) => handleChange(input.field, e.target.value)}
                />
              )}
              {input.field === "numero" && numeroExistant && (
                <p style={{ color: 'red', fontSize: '0.8rem' }}>
                  Ce numéro est déjà utilisé par une autre facture.
                </p>
              )}
            </div>
          ))}

          <div className="form-field">
            <label>Lignes de facture</label>
            {formData.lignes.map((ligne, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  placeholder="Désignation"
                  value={ligne.designation}
                  onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Quantité"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(index, 'quantite', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Prix unitaire"
                  value={ligne.prix_unitaire}
                  onChange={(e) => handleLigneChange(index, 'prix_unitaire', e.target.value)}
                />
                <button type="button" onClick={() => handleRemoveLigne(index)}>✕</button>
              </div>
            ))}
            <button type="button" onClick={handleAddLigne} style={{ marginTop: '0.5rem' }}>+ Ajouter une ligne</button>
          </div>

          <button onClick={handleSave}>Enregistrer la facture</button>
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

export default FactureDetail;
