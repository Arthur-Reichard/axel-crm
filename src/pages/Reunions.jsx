import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../helper/supabaseClient";
import './css/Reunion.css';
import jsPDF from 'jspdf';
import DashboardNavbar from "./DashboardNavbar";
import ChampsSettingsDrawer from '../components/ChampsSettingsDrawer';
import { FiChevronDown, FiSettings } from 'react-icons/fi';

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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [champVisibles, setChampVisibles] = useState([]);
  const [userId, setUserId] = useState(null); // si pas encore défini

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);


  const champsParDefaut = [
  'titre', 'date_reunion', 'heure_debut', 'heure_fin', 'lieu',
  'participants', 'objectifs', 'ordre_du_jour',
  'contenu', 'decisions', 'taches', 'commentaires'
];

useEffect(() => {
  const fetchChamps = async () => {
    const { data: existants, error } = await supabase
      .from('champs_reunion')
      .select('*')
      .eq('utilisateur_id', userId);

    if (error) return;

    if ((existants || []).length < champsParDefaut.length) {
      const existantsSet = new Set(existants.map(c => c.nom_champ));
      const manquants = champsParDefaut.filter(c => !existantsSet.has(c));
      const inserts = manquants.map(c => ({
        utilisateur_id: userId,
        nom_champ: c,
        visible: true
      }));

      if (inserts.length > 0) {
        await supabase.from('champs_reunion').insert(inserts);
      }

      const { data: nouveaux } = await supabase
        .from('champs_reunion')
        .select('*')
        .eq('utilisateur_id', userId);

      setChampVisibles(nouveaux || []);
    } else {
      setChampVisibles(existants);
    }
  };

  if (userId) fetchChamps();
}, [userId]);

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
    const checkPageOverflow = (doc, y) => {
      if (y > 270) {
        doc.addPage();
        doc.setFont('times', 'normal');
        return 25;
      }
      return y;
    };

    const left = 20;
    let y = 25;

    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, 190, 277);

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text(`Compte rendu – ${reunion.titre || 'Sans titre'}`, 105, y, { align: 'center' });
    y += 15;
    y = checkPageOverflow(doc, y);

    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const formatHeure = (heure) => {
      if (!heure) return '—';
      const [h, m] = heure.split(':');
      return `${h}h${m}`;
    };

    const lines = [
      `Date : ${reunion.date_reunion || '—'}`,
      `Heure : ${formatHeure(reunion.heure_debut)} - ${formatHeure(reunion.heure_fin)}`,
      `Lieu : ${reunion.lieu || '—'}`,
      `Participants : ${
        Array.isArray(reunion.participants)
          ? reunion.participants.map(p => p.nom || p).join(', ')
          : '—'
      }`
    ];

    lines.forEach(line => {
      doc.text(line, left, y);
      y += 7;
      y = checkPageOverflow(doc, y);
    });
    y += 5;

    const section = (label, value) => {
      doc.setFont('times', 'bold');
      doc.setFontSize(13);
      doc.text(label, left, y);
      y += 6;
      y = checkPageOverflow(doc, y);

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      const wrapped = doc.splitTextToSize(value || '—', 170);
      wrapped.forEach(line => {
        doc.text(line, left, y);
        y += 5;
        y = checkPageOverflow(doc, y);
      });
      y += 6;
    };

    section("Objectifs", reunion.objectifs);
    section("Contenu", reunion.contenu);

    // Ordre du jour
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("Ordre du jour", left, y);
    y += 6;
    y = checkPageOverflow(doc, y);

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    if (Array.isArray(reunion.ordre_du_jour) && reunion.ordre_du_jour.length > 0) {
      reunion.ordre_du_jour.forEach(item => {
        doc.text(`• ${item}`, left + 5, y);
        y += 6;
        y = checkPageOverflow(doc, y);
      });
    } else {
      doc.text("—", left + 5, y);
      y += 6;
      y = checkPageOverflow(doc, y);
    }
    y += 4;

    // Décisions
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("Décisions", left, y);
    y += 6;
    y = checkPageOverflow(doc, y);

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    if (Array.isArray(reunion.decisions) && reunion.decisions.length > 0) {
      reunion.decisions.forEach(d => {
        doc.text(`• ${d}`, left + 5, y);
        y += 6;
        y = checkPageOverflow(doc, y);
      });
    } else {
      doc.text("—", left + 5, y);
      y += 6;
      y = checkPageOverflow(doc, y);
    }
    y += 4;

    // Tâches
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text("Tâches", left, y);
    y += 6;
    y = checkPageOverflow(doc, y);

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    if (Array.isArray(reunion.taches) && reunion.taches.length > 0) {
      reunion.taches.forEach(t => {
        doc.text(`• ${t}`, left + 5, y);
        y += 6;
        y = checkPageOverflow(doc, y);
      });
    } else {
      doc.text("—", left + 5, y);
      y += 6;
      y = checkPageOverflow(doc, y);
    }
    y += 4;

    section("Commentaires", reunion.commentaires);

    // Footer
    doc.setFontSize(10);
    doc.setFont('times', 'italic');
    doc.setTextColor(150);
    const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);

  // Remet le cadre sur chaque page
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, 190, 277);

  // Pied de page
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.setTextColor(150);
  doc.text("Powered by Axel CRM", left, 285);

  // Légèrement décalé à gauche
  doc.text(`Page ${i}/${pageCount}`, 195, 285, { align: 'right' });
}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 className="reunion-header">Comptes Rendus</h1>
            <button
              className="reunion-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
              onClick={() => setDrawerOpen(true)}
            >
              <FiSettings />
              Champs
            </button>
          </div>
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
            <div
              key={r.id}
              className="reunion-item"
              style={{ cursor: 'pointer', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
              onClick={() => navigate(`/reunions/${r.id}`)}
            >
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
                  <p>{r.date_reunion} - {r.lieu}</p>
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>
                    Créé le {new Date(r.created_at).toLocaleString()}  Modifié le {new Date(r.updated_at).toLocaleString()}
                  </p>
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
      <ChampsSettingsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        preferences={champVisibles}
        setPreferences={setChampVisibles}
        utilisateurId={userId}
        supabase={supabase}
      />
    </div>
  );
};

export default Reunions;