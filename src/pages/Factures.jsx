import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../helper/supabaseClient";
import DashboardNavbar from "./DashboardNavbar";
import "../pages/css/Factures.css";
import { useNavigate } from "react-router-dom";
import { pdf } from '@react-pdf/renderer';
import FacturePDF from "../components/FacturePDF";
import { FiChevronUp, FiChevronDown, FiChevronDown as FiMenuDown, FiTrash2 } from 'react-icons/fi';

const Factures = () => {
  const [factures, setFactures] = useState([]);
  const [leads, setLeads] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      const { data: facturesData } = await supabase.from("factures").select("*");
      const { data: leadsData } = await supabase.from("leads").select("id, prenom, nom");
      setFactures(facturesData || []);
      setLeads(leadsData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helpers
  const getClientName = (id) => {
    const lead = leads.find(l => l.id === id);
    return lead ? `${lead.prenom} ${lead.nom}` : "-";
  };

  const handleClick = (factureId) => {
    navigate(`/factures/${factureId}`);
  };

  const STATUTS = [
    { label: "Brouillon", value: "brouillon", color: "#d1d5db" },     // gris
    { label: "Envoyée", value: "envoyee", color: "#3b82f6" },         // bleu
    { label: "Payée", value: "payee", color: "#22c55e" },             // vert
    { label: "En retard", value: "retard", color: "#f59e0b" },        // orange
    { label: "Annulée", value: "annulee", color: "#ef4444" },         // rouge
  ];

  const updateStatut = async (factureId, newStatut) => {
    const { error } = await supabase
      .from('factures')
      .update({ statut: newStatut })
      .eq('id', factureId);

    if (!error) {
      setFactures((prev) =>
        prev.map((f) => (f.id === factureId ? { ...f, statut: newStatut } : f))
      );
    }
  };

  const formatDateHeure = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const exporterPDF = async (facture) => {
    const blob = await pdf(
      <FacturePDF
        formData={facture}
        total_ttc={parseFloat(facture.total_ttc).toFixed(2)}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture_${facture.numero || "sans_numero"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(prev => (prev === id ? null : id));
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === factures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(factures.map(f => f.id));
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortedFactures = () => {
    if (!sortField) return factures;
    return [...factures].sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const supprimerSelection = async () => {
    if (selectedIds.length === 0) return;
    const confirmSuppression = window.confirm("Supprimer les factures sélectionnées ?");
    if (!confirmSuppression) return;

    const { error, data } = await supabase
      .from('factures')
      .delete()
      .in('id', selectedIds);

    if (error) {
      console.error("Erreur suppression Supabase :", error.message);
    } else {
      console.log("Factures supprimées :", data);
      setFactures((prev) => prev.filter(f => !selectedIds.includes(f.id)));
      setSelectedIds([]);
    }
  };


  const renderArrow = (field) => sortField === field ? (sortOrder === "asc" ? " ▲" : " ▼") : "";

  return (
    <div className="facture-page">
      <DashboardNavbar />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate("/factures/nouvelle")}
          className="facture-btn"
          style={{ marginBottom: "1rem" }}
        >
          + Nouvelle facture
        </button>

        {selectedIds.length > 0 && (
          <button
            onClick={supprimerSelection}
            className="delete-button"
          >
            <FiTrash2 /> Supprimer ({selectedIds.length})
          </button>
        )}
      </div>

   <div className="facture-wrapper">  
    <h2 style={{ marginBottom: '1rem' }}>Liste des factures</h2>
      <div className="facture-table-scroll-wrapper">
        <table className="facture-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedIds.length === factures.length && factures.length > 0}
                />
              </th>
              <th onClick={() => handleSort("numero")}>NUMÉRO{renderArrow("numero")}</th>
              <th onClick={() => handleSort("client")}>CLIENT{renderArrow("client")}</th>
              <th onClick={() => handleSort("date_facture")}>DATE{renderArrow("date_facture")}</th>
              <th onClick={() => handleSort("total_ht")}>TOTAL HT{renderArrow("total_ht")}</th>
              <th onClick={() => handleSort("total_ttc")}>TOTAL TTC{renderArrow("total_ttc")}</th>
              <th onClick={() => handleSort("statut")}>STATUT{renderArrow("statut")}</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {getSortedFactures().map((facture) => (
              <tr key={facture.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(facture.id)}
                    onChange={() => handleSelect(facture.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td onClick={() => handleClick(facture.id)}>
                  <div style={{ fontWeight: 600 }}>{facture.numero}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 4 }}>
                    Créé le : {formatDateHeure(facture.created_at)}<br />
                    Modifié le : {formatDateHeure(facture.updated_at)}
                  </div>
                </td>
                <td onClick={() => handleClick(facture.id)}>{getClientName(facture.client_id)}</td>
                <td onClick={() => handleClick(facture.id)}>{facture.date_facture || "-"}</td>
                <td onClick={() => handleClick(facture.id)}>{facture.total_ht} €</td>
                <td onClick={() => handleClick(facture.id)}>{facture.total_ttc} €</td>
                <td>
                  <select
                    value={facture.statut}
                    onChange={(e) => updateStatut(facture.id, e.target.value)}
                    style={{
                      backgroundColor: STATUTS.find(s => s.value === facture.statut)?.color || '#e5e7eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {STATUTS.map((s) => (
                      <option key={s.value} value={s.value} style={{ color: 'black' }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="export-dropdown" ref={dropdownRef}>
                    <button
                      className="export-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(facture.id);
                      }}
                    >
                      Exporter <FiChevronDown />
                    </button>
                    {openDropdown === facture.id && (
                      <ul
                        className="dropdown-menu"
                      >
                        <li onClick={(e) => {
                          e.stopPropagation();
                          exporterPDF(facture);
                          setOpenDropdown(null);
                        }}>
                          PDF
                        </li>
                      </ul>
                    )}
                  </div>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div> {/* fin facture-wrapper */}
    </div>
    
  );
};

export default Factures;
