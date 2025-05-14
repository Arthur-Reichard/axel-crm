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
  
  const [sortField, setSortField] = useState('date'); // ou 'titre'
  const [sortOrder, setSortOrder] = useState('desc'); // ou 'asc'

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
  const filename = (reunion.titre || 'compte_rendu').replace(/\s+/g, '_').toLowerCase();

  if (format === 'pdf') {
  const doc = new jsPDF();
const filename = (reunion.titre || 'compte_rendu').replace(/\s+/g, '_').toLowerCase();

// Bordure fine
doc.setDrawColor(200);
doc.setLineWidth(0.3);
doc.rect(10, 10, 190, 277);

let y = 25;
const left = 20;

// Titre centré
doc.setFont('times', 'bold');
doc.setFontSize(16);
doc.text(`Compte rendu – ${reunion.titre || 'Sans titre'}`, 105, y, { align: 'center' });
y += 15;

// Infos générales
doc.setFont('times', 'normal');
doc.setFontSize(12);
doc.text(`Date : ${reunion.date_reunion || '—'}`, left, y); y += 7;
doc.text(`Lieu : ${reunion.lieu || '—'}`, left, y); y += 7;
doc.text(`Participants : ${
  Array.isArray(reunion.participants)
    ? reunion.participants.map(p => p.nom || p).join(', ')
    : '—'
}`, left, y);
y += 12;

// Section renderer
const section = (label, value) => {
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(label, left, y);
  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(value || '—', 170);
  doc.text(lines, left, y);
  y += lines.length * 5 + 8;
};

// Sections
section("Objectifs", reunion.objectifs);
section("Contenu", reunion.contenu);
section("Commentaires", reunion.commentaires);

// Footer gauche : signature
doc.setFontSize(10);
doc.setFont('times', 'italic');
doc.setTextColor(150);
doc.text("Powered by Axel CRM", left, 285);

// Footer droite : pagination
doc.setFont('times', 'normal');
doc.setFontSize(10);
doc.text(`Page 1/1`, 190, 285, { align: 'right' });

// Génération
doc.save(`${filename}.pdf`);
}


  else if (format === 'txt') {
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
    const blob = new Blob([content], { type: 'text/plain' });
    triggerDownload(blob, `${filename}.txt`);
  }

  else if (format === 'docx') {
    const content = `
      <html>
        <body>
          <h1>${reunion.titre || "Compte rendu"}</h1>
          <p><strong>Date :</strong> ${reunion.date_reunion || '—'}</p>
          <p><strong>Lieu :</strong> ${reunion.lieu || '—'}</p>
          <p><strong>Participants :</strong> ${
            Array.isArray(reunion.participants)
              ? reunion.participants.map(p => p.nom || p).join(', ')
              : '—'
          }</p>
          <h2>Objectifs</h2>
          <p>${reunion.objectifs || '—'}</p>
          <h2>Contenu</h2>
          <p>${reunion.contenu || '—'}</p>
          <h2>Commentaires</h2>
          <p>${reunion.commentaires || '—'}</p>
        </body>
      </html>
    `;
    const blob = new Blob([content], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    triggerDownload(blob, `${filename}.docx`);
  }
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const sortedReunions = [...reunions].sort((a, b) => {
  const valA = a[sortField]?.toLowerCase?.() || a[sortField];
  const valB = b[sortField]?.toLowerCase?.() || b[sortField];

  if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
  if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
  return 0;
});

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
        <div className="tri-container">
          <label className="tri-label">Trier par</label>
          <select
            className="tri-select"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="date_reunion">Date</option>
            <option value="titre">Titre</option>
            <option value="lieu">Lieu</option>
          </select>
          <button className="tri-button" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            {sortOrder === 'asc' ? '⬆️ Ascendant' : '⬇️ Descendant'}
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
          {sortedReunions.map((r) => (
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
                    <li onClick={(e) => {
                      e.stopPropagation();
                      (() => exporter(r, 'pdf'))();  // ici on capture bien r
                      setOpenDropdown(null);
                    }}>
                      PDF
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      (() => exporter(r, 'docx'))();
                      setOpenDropdown(null);
                    }}>
                      DOCX
                    </li>
                    <li onClick={(e) => {
                      e.stopPropagation();
                      (() => exporter(r, 'txt'))();
                      setOpenDropdown(null);
                    }}>
                      TXT
                    </li>
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reunions;