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

    // Récupère les membres de l'entreprise
    const { data: membres, error: membresErr } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, poste')
      .eq('entreprise_id', entrepriseId);

    if (!membresErr && membres) {
      membresFinal = membres;
    }

    // Fallback si certains participants du form ne sont pas dans la liste récupérée
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

  const handleParticipantSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(opt => {
      const utilisateur = utilisateurs.find(u => u.id === opt.value);
      return {
        nom: `${utilisateur.prenom} ${utilisateur.nom}`,
        fonction: utilisateur.poste || '',
        utilisateur_id: utilisateur.id
      };
    });
    setForm({ ...form, participants: selected });
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
  <div className="reunions-page">
    <DashboardNavbar />
    <div className="reunion-form">
      <h2 className="full">Nouveau Compte Rendu</h2>

      <div className="form-group">
        <label>Titre</label>
        <input name="titre" value={form.titre} onChange={handleChange} placeholder="Titre" />
      </div>

      <div className="form-group">
        <label>Date</label>
        <input type="date" name="date_reunion" value={form.date_reunion} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Lieu</label>
        <input name="lieu" value={form.lieu} onChange={handleChange} placeholder="Lieu" />
      </div>

      <div className="form-group">
        <label>Ajouter un participant (manuel)</label>
        <input
          type="text"
          placeholder="Tapez un nom et appuyez sur Entrée"
          onKeyDown={handleParticipantLibre}
        />
      </div>

      <div className="form-group full">
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

      <div className="form-group full">
        <label>Participants ajoutés</label>
        <div>
          {form.participants.map((p, idx) => (
            <span key={idx} className="participant-chip">{p.nom}</span>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Objectifs</label>
        <textarea name="objectifs" value={form.objectifs} onChange={handleChange} placeholder="Objectifs" />
      </div>

      <div className="form-group">
        <label>Contenu de la réunion</label>
        <textarea name="contenu" value={form.contenu} onChange={handleChange} placeholder="Contenu de la réunion" />
      </div>

      <div className="form-group full">
        <label>Commentaires internes</label>
        <textarea name="commentaires" value={form.commentaires} onChange={handleChange} placeholder="Commentaires internes" />
      </div>

      <button className="reunion-btn" onClick={enregistrer}>Enregistrer</button>
    </div>
  </div>
);
};

export default NouveauCompteRendu;
