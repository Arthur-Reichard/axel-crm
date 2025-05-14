import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../helper/supabaseClient";
import './css/Reunion.css';
import DashboardNavbar from "./DashboardNavbar";

const NouveauCompteRendu = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [utilisateurs, setUtilisateurs] = useState([]);

  const [form, setForm] = useState({
    titre: '',
    date_reunion: new Date().toISOString().slice(0, 10),
    lieu: '',
    participants: [],
    objectifs: '',
    ordre_du_jour: [],
    contenu: '',
    decisions: [],
    taches: [],
    commentaires: ''
  });

  const [showToast, setShowToast] = useState(false);
  const [showConfirmToast, setShowConfirmToast] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        alert("Utilisateur non connecté.");
        return;
      }

      setUserId(user.id);

      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("entreprise_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.entreprise_id) {
        alert("Entreprise introuvable dans la table utilisateurs.");
      } else {
        setEntrepriseId(userData.entreprise_id);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchUtilisateurs = async () => {
      if (!entrepriseId) return;

      let membresFinal = [];

      const { data: membres, error: membresErr } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, poste')
        .eq('entreprise_id', entrepriseId);

      if (!membresErr && membres) {
        membresFinal = membres;
      }

      for (const p of form.participants) {
        if (p.utilisateur_id && !membresFinal.find(m => m.id === p.utilisateur_id)) {
          const { data: membreManquant, error: membreErr } = await supabase
            .from('utilisateurs')
            .select('id, nom, prenom, poste')
            .eq('id', p.utilisateur_id)
            .single();

          if (!membreErr && membreManquant) {
            membresFinal = [...membresFinal, membreManquant];
          }
        }
      }

      setUtilisateurs(membresFinal);
    };

    fetchUtilisateurs();
  }, [entrepriseId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const enregistrer = async () => {
    if (!userId || !entrepriseId) {
      alert("Utilisateur ou entreprise non défini.");
      return;
    }

    const { error } = await supabase.from('comptes_rendus_reunion').insert([
      {
        ...form,
        cree_par: userId,
        entreprise_id: entrepriseId
      }
    ]);

    if (!error) navigate('/reunions');
    else alert("Erreur : " + error.message);
  };

  const handleParticipantLibre = (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
      setForm({
        ...form,
        participants: [
          ...form.participants,
          { nom: e.target.value.trim(), fonction: '', utilisateur_id: null }
        ]
      });
      e.target.value = '';
    }
  };

  return (
    <div className="reunion-page">
      <div className="reunion-form">
        <div style={{ gridColumn: "span 12", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => setShowConfirmToast(true)}
            style={{
              background: "none",
              border: "1px solid #ccc",
              color: "#111",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              marginBottom: "1rem"
            }}
          >
            ← Retour
          </button>
        </div>

        <h2>Nouveau Compte Rendu</h2>

        <div className="form-group third">
          <label>Titre</label>
          <input name="titre" value={form.titre} onChange={handleChange} placeholder="Titre de la réunion" />
        </div>

        <div className="form-group third">
          <label>Date</label>
          <input type="date" name="date_reunion" value={form.date_reunion} onChange={handleChange} />
        </div>

        <div className="form-group third">
          <label>Lieu</label>
          <input name="lieu" value={form.lieu} onChange={handleChange} placeholder="Lieu de la réunion" />
        </div>

        <div className="form-group third">
          <label>Ajouter un participant (manuel)</label>
          <input type="text" placeholder="Prénom Nom" onKeyDown={handleParticipantLibre} />
        </div>

        <div className="form-group third">
          <label>Ajouter un participant depuis l’entreprise</label>
          <select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              const utilisateur = utilisateurs.find(u => u.id === id);
              if (!utilisateur) return;

              const nomComplet = `${utilisateur.prenom} ${utilisateur.nom}`;
              const dejaAjoute = form.participants.some(p => p.utilisateur_id === id);

              if (!dejaAjoute) {
                setForm((prev) => ({
                  ...prev,
                  participants: [
                    ...prev.participants,
                    {
                      nom: nomComplet,
                      fonction: utilisateur.poste || '',
                      utilisateur_id: id
                    }
                  ]
                }));
              }
            }}
          >
            <option value="" disabled hidden>Choisir un membre</option>
            {utilisateurs.map((u) => (
              <option key={u.id} value={u.id}>
                {u.prenom} {u.nom} ({u.poste || '—'})
              </option>
            ))}
          </select>
        </div>

        <div className="form-block">
          <label>Participants ajoutés</label>
          <div>
            {form.participants.map((p, idx) => (
              <span key={idx} className="participant-chip">{p.nom}</span>
            ))}
          </div>
        </div>

        <div className="form-block">
          <label>Objectifs</label>
          <textarea name="objectifs" value={form.objectifs} onChange={handleChange} placeholder="Décrivez les objectifs de la réunion" />
        </div>

        <div className="form-block">
          <label>Contenu de la réunion</label>
          <textarea name="contenu" value={form.contenu} onChange={handleChange} placeholder="Résumé de ce qui a été dit, débattu, décidé..." />
        </div>

        <div className="form-block">
          <label>Commentaires internes</label>
          <textarea name="commentaires" value={form.commentaires} onChange={handleChange} placeholder="Notes internes ou remarques confidentielles" />
        </div>

        <button className="reunion-btn" onClick={enregistrer}>Enregistrer</button>
      </div>

      {showConfirmToast && (
        <div className="toast-confirm">
          <h4>Voulez-vous vraiment abandonner le brouillon ?</h4>
          <div className="toast-confirm-buttons">
            <button className="cancel-btn" onClick={() => setShowConfirmToast(false)}>Annuler</button>
            <button className="confirm-btn" onClick={() => navigate("/reunions")}>Oui, quitter</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NouveauCompteRendu;
