import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../helper/supabaseClient";
import './css/Reunion.css';
import jsPDF from 'jspdf';
import { FiChevronDown } from 'react-icons/fi';

const Reunions = () => {
  const [reunions, setReunions] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
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
    <div className="reunion-page">
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="reunion-header">Comptes Rendus</h1>
        <button className="reunion-btn" onClick={() => navigate('/reunions/nouveau')}>
          + Nouveau compte rendu
        </button>
      </div>

      <div className="reunion-list">
        {reunions.map((r) => (
          <div key={r.id} className="reunion-item" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="reunion-left" onClick={() => navigate(`/reunions/${r.id}`)}>
              <h3>{r.titre}</h3>
              <p>{r.date_reunion} — {r.lieu}</p>
            </div>

            <div
              className="export-dropdown"
              ref={dropdownRef}
              style={{ position: 'relative' }}
            >
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
  );
};

export default Reunions;