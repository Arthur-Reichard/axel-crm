import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../helper/supabaseClient";
import './css/Reunion.css';
import jsPDF from 'jspdf';
import DashboardNavbar from "./DashboardNavbar";

const Reunions = () => {
  const [reunions, setReunions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
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

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

const exporter = (reunion, format) => {
  const content = `
    Titre : ${reunion.titre}
    Date : ${reunion.date_reunion}
    Lieu : ${reunion.lieu}
    Participants : ${reunion.participants?.map(p => p.nom).join(', ') || '—'}

    Objectifs :
    ${reunion.objectifs || '—'}

    Contenu :
    ${reunion.contenu || '—'}

    Commentaires :
    ${reunion.commentaires || '—'}
  `;

  const filename = reunion.titre.replace(/\s+/g, '_').toLowerCase();

  if (format === 'pdf') {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(content, 10, 20);
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

        <div className="reunion-list">
          {reunions.map((r) => (
            <div key={r.id} className="reunion-item" onClick={() => navigate(`/reunions/${r.id}`)}>
              <div className="reunion-left">
                <h3>{r.titre}</h3>
                <p>{r.date_reunion} — {r.lieu}</p>
              </div>

              <div
                className="export-dropdown"
                onClick={(e) => e.stopPropagation()} // ⛔ bloque le clic global
              >
                <button
                  className="export-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(r.id);
                  }}
                >
                  Exporter
                </button>

                {openDropdown === r.id && (
                  <ul className="dropdown-menu">
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'pdf'); }}>PDF</li>
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'docx'); }}>DOCX</li>
                    <li onClick={(e) => { e.stopPropagation(); exporter(r, 'txt'); }}>TXT</li>
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
