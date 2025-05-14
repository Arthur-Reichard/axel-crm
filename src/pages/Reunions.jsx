import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../helper/supabaseClient";
import './css/Reunion.css';
import jsPDF from 'jspdf';
import { FiChevronDown } from 'react-icons/fi';
import DashboardNavbar from "./DashboardNavbar";

const Reunions = () => {
  const [reunions, setReunions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showConfirmToast, setShowConfirmToast] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReunions = async () => {
      const { data, error } = await supabase
        .from('comptes_rendus_reunion')
        .select('*')
        .order('date_reunion', { ascending: false });
      if (!error) setReunions(data);
    };
    fetchReunions();
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

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleCheckboxChange = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reunions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reunions.map((r) => r.id));
    }
  };

  const supprimerSelection = async () => {
    if (selectedIds.length === 0) return;
    setLoadingDelete(true);
    const { error } = await supabase
      .from('comptes_rendus_reunion')
      .delete()
      .in('id', selectedIds);
    setLoadingDelete(false);
    setShowConfirmToast(false);
    if (!error) {
      const updated = await supabase
        .from('comptes_rendus_reunion')
        .select('*')
        .order('date_reunion', { ascending: false });

      setReunions(updated.data || []);
      setSelectedIds([]);
      setToastMessage({ text: "Suppression réussie", type: "success" });
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setToastMessage({ text: "Erreur lors de la suppression", type: "error" });
      setTimeout(() => setToastMessage(""), 3000);
    }   
  };

  const exporter = (reunion, format) => {
    const content = `
      Titre : ${reunion.titre}
      Date : ${reunion.date_reunion}
      Lieu : ${reunion.lieu}
      Participants : ${
        Array.isArray(reunion.participants)
          ? reunion.participants.map(p => p.nom || p).join(', ')
          : '—'
      }

      Objectifs :
      ${reunion.objectifs || '—'}

      Contenu :
      ${reunion.contenu || '—'}

      Commentaires :
      ${reunion.commentaires || '—'}
    `;

    const filename = (reunion.titre || 'compte_rendu').replace(/\s+/g, '_').toLowerCase();


    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(content, 180); // largeur max = 180
      doc.text(lines, 10, 20);
      doc.save(`${filename}.pdf`);
    } else if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      triggerDownload(blob, `${filename}.txt`);
    } else if (format === 'docx') {
      const blob = new Blob(
        [`<html><body><pre>${content}</pre></body></html>`],
        { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      );
      triggerDownload(blob, `${filename}.docx`);
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

section("Objectifs :", reunion.objectifs);
section("Contenu :", reunion.contenu);
section("Commentaires :", reunion.commentaires);

doc.save(`${filename}.pdf`);

  return (
    <div className="reunions-page">
      <DashboardNavbar />
      <div className="reunion-page">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="reunion-header">Comptes Rendus</h1>
          <button className="reunion-btn" onClick={() => navigate('/reunions/nouveau')}>
            + Nouveau compte rendu
          </button>
        </div>

        {toastMessage && (
          <div className={`toast ${toastMessage.type}`}>
            {toastMessage.type === "success" ? "✅" : "❌"} {toastMessage.text}
          </div>
        )}


        {selectedIds.length > 0 && !showConfirmToast && (
          <button
            className="delete-button"
            onClick={() => setShowConfirmToast(true)}
          >
            Supprimer ({selectedIds.length})
          </button>
        )}

          {showConfirmToast && (
            <div className="confirm-toast">
              <span>🗑️ Voulez-vous supprimer {selectedIds.length} élément(s) ?</span>
              <button onClick={supprimerSelection} disabled={loadingDelete} className="confirm-button">Confirmer</button>
              <button onClick={() => setShowConfirmToast(false)} className="cancel-button">Annuler</button>
            </div>
          )}

        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
            <input
              type="checkbox"
              onChange={handleSelectAll}
              checked={selectedIds.length === reunions.length && reunions.length > 0}
            />
            <span style={{ fontSize: '0.95rem' }}>Tout sélectionner</span>
          </div>
        )}

        <div className="reunion-list">
          {reunions.length === 0 && (
            <p className="empty-message">Oups ! Il n'y a rien à afficher pour le moment !</p>
          )}
          {reunions.map((r) => (
            <div key={r.id} className="reunion-item" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(r.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleCheckboxChange(r.id);
                  }}
                />
                <div className="reunion-left" onClick={() => navigate(`/reunions/${r.id}`)}>
                  <h3>{r.titre}</h3>
                  <p>{r.date_reunion} — {r.lieu}</p>
                </div>
              </div>

              <div className="export-dropdown" ref={dropdownRef} style={{ marginLeft: 'auto' }}>
                <button
                  className="export-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(r.id);
                  }}
                >
                  Exporter <FiChevronDown />
                </button>

                {openDropdown === r.id && (
                  <ul className="dropdown-menu" style={{ listStyle: 'none' }}>
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'pdf'); setOpenDropdown(null); }}>PDF</li>
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'docx'); setOpenDropdown(null); }}>DOCX</li>
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'txt'); setOpenDropdown(null); }}>TXT</li>
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => {
  const doc = new jsPDF();
  doc.text("Hello world", 10, 10);
  doc.save("test.pdf");
}}>
  Test Export PDF
</button>

    </div>
  );
};

export default Reunions;