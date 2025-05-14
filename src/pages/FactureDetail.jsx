import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../helper/supabaseClient";
import DashboardNavbar from "./DashboardNavbar";

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [formData, setFormData] = useState({
    client: "",
    adresse: "",
    adresse_facturation: "",
    date_prestation: "",
    date_echeance: "",
    type_operation: "service",
    objet: "",
    lignes: [],
    remise: 0,
    tva: 20,
    penalite_retard: "10% du montant TTC",
    indemnite_recouvrement: 40,
    garantie_legale: false,
    paiement_tva_debits: false,
    siret: "",
    statut_juridique: "",
    siege_social: "",
    total_ht: "",
  });

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
          adresse: lead.adresse || "",
          adresse_facturation: lead.adresse || "",
        }));
      }
    }
  }, [selectedLeadId]);

  const total_ttc = formData.total_ht
    ? (parseFloat(formData.total_ht) * (1 + formData.tva / 100)).toFixed(2)
    : "";

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { data: last } = await supabase
      .from("factures")
      .select("numero")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let newNumero = "AXL-2025-001";
    if (last?.numero) {
      const lastNum = parseInt(last.numero.split("-").pop());
      const next = String(lastNum + 1).padStart(3, "0");
      newNumero = `AXL-2025-${next}`;
    }

    const { error } = await supabase.from("factures").insert({
      numero: newNumero,
      ...formData,
      client_id: selectedLeadId || null,
      total_ttc,
      statut: "brouillon",
      date_emission: new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Erreur création :", error);
      alert("Erreur lors de la création");
    } else {
      alert("Facture enregistrée !");
      navigate("/factures");
    }
  };

  return (
    <div className="facture-detail-page">
      <DashboardNavbar />
      <div className="facture-detail-body">
        <div className="facture-formulaire">
          <h2>Nouvelle facture</h2>

          {[
            { label: "Prospect lié (optionnel)", type: "select", options: leads.map(lead => ({ value: lead.id, label: `${lead.prenom} ${lead.nom}` })), field: "selectedLeadId" },
            { label: "Client", field: "client" },
            { label: "Adresse", field: "adresse" },
            { label: "Adresse de facturation", field: "adresse_facturation" },
            { label: "Date de la prestation", field: "date_prestation", type: "date" },
            { label: "Date d’échéance", field: "date_echeance", type: "date" },
            { label: "Objet", field: "objet" },
            { label: "Montant HT", field: "total_ht", type: "number" },
            { label: "TVA (%)", field: "tva", type: "number" },
            { label: "Type d’opération", type: "select", options: [
              { value: "service", label: "Prestation de service" },
              { value: "livraison", label: "Livraison de biens" },
              { value: "mixte", label: "Mixte" },
            ], field: "type_operation" },
            { label: "Pénalités de retard", field: "penalite_retard" },
            { label: "Garantie légale applicable ?", field: "garantie_legale", type: "checkbox" },
            { label: "TVA sur les débits ?", field: "paiement_tva_debits", type: "checkbox" },
            { label: "SIRET", field: "siret" },
            { label: "Statut juridique", field: "statut_juridique" },
            { label: "Adresse du siège", field: "siege_social" },
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
              ) : input.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={formData[input.field]}
                  onChange={(e) => handleChange(input.field, e.target.checked)}
                />
              ) : (
                <input
                  type={input.type || "text"}
                  value={formData[input.field]}
                  onChange={(e) => handleChange(input.field, e.target.value)}
                />
              )}
            </div>
          ))}

          <button onClick={handleSave}>Enregistrer la facture</button>
        </div>

        <div className="facture-preview-pdf" style={{ backgroundColor: "white", color: "black" }}>
          <div className="pdf-container">
            <h1>FACTURE</h1>
            <div className="pdf-section">
              <div>
                <p><strong>Émetteur :</strong></p>
                <p>{formData.siret}</p>
                <p>{formData.statut_juridique}</p>
                <p>{formData.siege_social}</p>
              </div>
              <div>
                <p><strong>Client :</strong></p>
                <p>{formData.client}</p>
                <p>{formData.adresse_facturation}</p>
              </div>
            </div>

            <div className="pdf-section">
              <p><strong>Objet :</strong> {formData.objet}</p>
              <p><strong>Date prestation :</strong> {formData.date_prestation}</p>
              <p><strong>Date échéance :</strong> {formData.date_echeance}</p>
            </div>

            <div className="pdf-section montant">
              <p><strong>Total HT :</strong> {formData.total_ht} €</p>
              <p><strong>TVA {formData.tva}% :</strong> {(parseFloat(formData.total_ht || 0) * (formData.tva / 100)).toFixed(2)} €</p>
              <p><strong>Total TTC :</strong> {total_ttc} €</p>
            </div>

            <div className="pdf-section mentions">
              <p>Pénalités de retard : {formData.penalite_retard}</p>
              <p>Indemnité de recouvrement : {formData.indemnite_recouvrement} €</p>
              {formData.garantie_legale && <p>Garantie légale de conformité : 2 ans</p>}
              {formData.paiement_tva_debits && <p>TVA sur les débits : OUI</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactureDetail;
