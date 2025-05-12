import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';
import AdresseAutocomplete from '../components/AdresseAutocomplete';
import { FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'react-router-dom';


export default function EntrepriseClientDetail() {
  const [searchParams] = useSearchParams();
  const clientType = searchParams.get("type") || "Entreprises";
  const { id } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const adresseRef = useRef({});
  const [visibleFields, setVisibleFields] = useState([]);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(false);
  const [utilisateurId, setUtilisateurId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingInsee, setIsFetchingInsee] = useState(false);

  const statutEntrepriseLabels = {
    A: "Active",
    C: "Cessée",
    F: "Fermée"
  };

  const entrepriseFields = [
    { label: "Nom de l'entreprise", name: "raison_sociale" },
    { label: "SIREN", name: "siren" },
    { label: "SIRET", name: "siret" },
    { label: "Forme juridique", name: "forme_juridique" },
    { label: "Capital social (€)", name: "capital_social" },
    { label: "Date immatriculation", name: "date_immatriculation", type: "date" },
    { label: "Téléphone", name: "telephone_professionnel" },
    { label: "Email", name: "email_professionnel" },
    { label: "Site web", name: "site_web" },
    { label: "Code APE (NAF)", name: "naf_code" },
    { label: "Activité principale", name: "naf_label" },
    { label: "Statut", name: "statut_entreprise" },
    { label: "N° RCS", name: "numero_rcs" },
    { label: "Notes", name: "notes", type: "textarea" }
  ];

  const fetchInseeData = async () => {
    if (!entreprise?.siren || entreprise.siren.length !== 9) {
      alert("Veuillez saisir un SIREN valide (9 chiffres).");
      return;
    }

    setIsFetchingInsee(true); // démarre le chargement

    try {
      const response = await fetch(`http://localhost:8000/axel-crm/insee/${entreprise.siren}?utilisateur_id=${utilisateurId}`);
      const data = await response.json();

      if (data.error) {
        alert("Erreur INSEE : " + data.error);
        return;
      }

      setEntreprise((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Erreur appel API INSEE :", error);
      alert("Impossible de récupérer les données INSEE.");
    } finally {
      setIsFetchingInsee(false); // arrête le chargement
    }
  };


useEffect(() => {
  const fetchEntreprise = async () => {
    setIsLoading(true); // ➤ démarre le chargement

    try {
      // 🔑 Récupère l'utilisateur connecté
      const {
        data: { user },
        error: userErr
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        console.error("Utilisateur non authentifié");
        return;
      }

      setUtilisateurId(user.id);

      // 🔁 Charge les infos de l'entreprise
      const { data, error } = await supabase
        .from('entreprises_clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error("Erreur chargement entreprise :", error);
        return;
      }

      setEntreprise(data);

      // 🔁 Stocke l'adresse pour modification éventuelle
      adresseRef.current = {
        adresse_entreprise_rue: data.adresse_entreprise_rue,
        adresse_entreprise_cp: data.adresse_entreprise_cp,
        adresse_entreprise_ville: data.adresse_entreprise_ville,
        adresse_entreprise_pays: data.adresse_entreprise_pays
      };

      // 🔎 Récupère entreprise_id du créateur pour champs visibles
      const { data: utilisateur, error: utilisateurErr } = await supabase
        .from('utilisateurs')
        .select('entreprise_id')
        .eq('id', data.created_by)
        .single();

      if (!utilisateur || utilisateurErr) {
        console.warn("Impossible de récupérer entreprise_id");
        return;
      }

      // ✅ Récupère les champs visibles pour les fiches entreprise
      const { data: visibles, error: visibleErr } = await supabase
        .from('champs_visibles')
        .select('nom_champ')
        .eq('entreprise_id', utilisateur.entreprise_id)
        .eq('type_fiche', 'entreprise')
        .eq('visible', true);

      if (!visibleErr && visibles) {
        setVisibleFields(visibles.map(v => v.nom_champ));
      }
    } catch (err) {
      console.error("Erreur inattendue :", err);
    } finally {
      setLoading(false);   // ancienne version de "chargement principal"
      setIsLoading(false); // ➤ désactive l’overlay
    }
  };

  fetchEntreprise();
}, [id]);

  const handleChange = (e) => {
    setEntreprise((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!entreprise) return;

    const payload = {
      ...entreprise,
      ...adresseRef.current
    };

    const { error } = await supabase
      .from('entreprises_clients')
      .update(payload)
      .eq('id', id)
      .select();

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      localStorage.setItem('leadUpdated', 'true');
      navigate('/leads');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement cette entreprise ?")) return;

    const { error } = await supabase
      .from('entreprises_clients')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      navigate('/leads');
    }
  };

  if (loading || !entreprise) return <p style={{ padding: '2rem' }}>Chargement...</p>;

return (
  <>
    {(isLoading || isFetchingInsee) && (
      <div className="overlay-loading">
        <div className="spinner" />
      </div>
    )}
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Fiche Entreprise</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => navigate(`/leads?type=${clientType}`)}>← Retour</button>
          <button onClick={() => setFieldSettingsOpen(true)} className="settings-btn" title="Gérer les champs visibles">
            <FiSettings size={22} />
          </button>
        </div>
      </div>

      <div className="lead-detail-grid">
        <button onClick={fetchInseeData} className="greffe-btn">
          Récupérer depuis l'INSEE
        </button>
        {entrepriseFields
          .filter(f => visibleFields.includes(f.name))
          .map(({ label, name, type = "text" }) => (
            <div
              className="lead-field"
              key={name}
              style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}
            >
              <label htmlFor={name}>{label}</label>
              {name === "statut_entreprise" ? (
                <input
                  id={name}
                  type="text"
                  name={name}
                  value={statutEntrepriseLabels[entreprise[name]] || entreprise[name] || ''}
                  disabled
                />
              ) : (
                <input
                  id={name}
                  type={type}
                  name={name}
                  value={entreprise[name] || ''}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}

        <div className="lead-field adresse-bloc">
          <label>Adresse (auto-complétée)</label>
          <AdresseAutocomplete
            onPlaceSelected={(place) => {
              const components = place.address_components || [];
              const get = (type) => components.find((c) => c.types.includes(type))?.long_name || '';

              const newAdresse = {
                adresse_entreprise_rue: [get('street_number'), get('route')].filter(Boolean).join(' '),
                adresse_entreprise_ville: get('locality') || get('postal_town'),
                adresse_entreprise_cp: get('postal_code'),
                adresse_entreprise_pays: get('country')
              };

              adresseRef.current = newAdresse;

              setEntreprise((prev) => ({ ...prev, ...newAdresse }));
            }}
          />
        </div>

        <div className="adresse-hidden-fields">
          <div className="lead-field">
            <label>Rue</label>
            <input type="text" name="adresse_entreprise_rue" value={entreprise.adresse_entreprise_rue || ''} disabled />
          </div>
          <div className="lead-field">
            <label>Ville</label>
            <input type="text" name="adresse_entreprise_ville" value={entreprise.adresse_entreprise_ville || ''} disabled />
          </div>
          <div className="lead-field">
            <label>Code Postal</label>
            <input type="text" name="adresse_entreprise_cp" value={entreprise.adresse_entreprise_cp || ''} disabled />
          </div>
          <div className="lead-field">
            <label>Pays</label>
            <input type="text" name="adresse_entreprise_pays" value={entreprise.adresse_entreprise_pays || ''} disabled />
          </div>
        </div>

        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Date d'ajout</label>
          <input type="text" value={new Date(entreprise.created_at).toLocaleString()} readOnly />
        </div>
        <div className="lead-field" style={{ gridColumn: '1 / -1' }}>
          <label>Dernière modification</label>
          <input type="text" value={new Date(entreprise.updated_at).toLocaleString()} readOnly />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>Supprimer</button>
      </div>

      {fieldSettingsOpen && (
        <div className="drawer-overlay" onClick={() => setFieldSettingsOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Champs visibles (entreprise)</h2>
            <ul className="custom-field-list">
              {entrepriseFields.map(field => (
                <li key={field.name} className="custom-field-item">
                  <span>{field.label}</span>
                  <button
                    onClick={async () => {
                      const isVisible = visibleFields.includes(field.name);
                      const utilisateurId = entreprise.created_by;

                      const { data: utilisateur, error: utilisateurErr } = await supabase
                        .from('utilisateurs')
                        .select('entreprise_id')
                        .eq('id', utilisateurId)
                        .single();

                      if (!utilisateur || utilisateurErr) {
                        console.warn("Impossible de récupérer entreprise_id");
                        return;
                      }

                      const entrepriseId = utilisateur.entreprise_id;

                      const { error } = await supabase
                        .from('champs_visibles')
                        .upsert({
                          entreprise_id: entrepriseId,
                          nom_champ: field.name,
                          visible: !isVisible,
                          type_fiche: 'entreprise'
                        }, { onConflict: ['entreprise_id', 'nom_champ', 'type_fiche'] });

                      if (error) {
                        console.error("Erreur modification visibilité :", error.message);
                        return;
                      }

                      const { data: visibles, error: fetchErr } = await supabase
                        .from('champs_visibles')
                        .select('nom_champ')
                        .eq('entreprise_id', entrepriseId)
                        .eq('type_fiche', 'entreprise')
                        .eq('visible', true);

                      if (!fetchErr) {
                        setVisibleFields(visibles.map(v => v.nom_champ));
                      }
                    }}
                  >
                    {visibleFields.includes(field.name) ? <FiEye /> : <FiEyeOff />}
                  </button>
                </li>
              ))}
            </ul>

            <div className="drawer-buttons">
              <button className="cancel-btn" onClick={() => setFieldSettingsOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
   </>
  );
}