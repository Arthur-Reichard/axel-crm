import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';
import AdresseAutocomplete from '../components/AdresseAutocomplete';
import { FiSettings, FiEye, FiEyeOff, FiSave, FiTrash2 } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';
import { useSearchParams } from 'react-router-dom';
import DashboardNavbar from "./DashboardNavbar";

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
  const [customFields, setCustomFields] = useState([]);
  const [newField, setNewField] = useState({ nom_affichage: '', nom_champ: '', type: 'text' });

  const statutEntrepriseLabels = {
    A: "Active",
    C: "Cessée",
    F: "Fermée"
  };


  const baseFields = [
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

  const entrepriseFields = [...baseFields, ...customFields.map(f => ({
    label: f.nom_affichage,
    name: f.nom_champ,
    type: f.type,
    options: f.options || []
  }))];


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

      // ➕ Récupère les valeurs des champs personnalisés
      const { data: valeurs, error: valeursErr } = await supabase
        .from('valeurs_champs_personnalises')
        .select('nom_champ, valeur')
        .eq('entreprise_client_id', id);

      if (!valeursErr && valeurs) {
        const valeursMap = Object.fromEntries(valeurs.map(v => [v.nom_champ, v.valeur]));
        console.log("📥 Champs personnalisés récupérés :", valeursMap);
        setEntreprise(prev => ({ ...prev, ...valeursMap }));
      } else if (valeursErr) {
        console.error("❌ Erreur récupération champs personnalisés :", valeursErr.message);
      }

      // ➕ Charge les champs personnalisés (structure)
      const { data: custom, error: customErr } = await supabase
        .from('champs_personnalises')
        .select('*')
        .eq('entreprise_id', data.entreprise_id)
        .eq('type_fiche', 'entreprise');

      if (!customErr && custom) {
        setCustomFields(custom);
      }

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

      const { data: visibles, error: visibleErr } = await supabase
        .from('champs_visibles')
        .select('nom_champ')
        .eq('entreprise_id', utilisateur.entreprise_id)
        .eq('type_fiche', 'entreprise')
        .eq('visible', true);

      if (!visibleErr && visibles && visibles.length > 0) {
        setVisibleFields(visibles.map(v => v.nom_champ));
      } else {
        // ⚙️ Champs à afficher la première fois
        const champsParDefaut = [
          'raison_sociale',
          'siren',
          'siret',
          'telephone_professionnel',
          'email_professionnel',
          'site_web',
          'notes'
        ];

        setVisibleFields(champsParDefaut);

        const inserts = champsParDefaut.map(nom => ({
          entreprise_id: utilisateur.entreprise_id,
          nom_champ: nom,
          visible: true,
          type_fiche: 'entreprise'
        }));

        await supabase.from('champs_visibles').insert(inserts);
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

  const toggleFieldVisibility = async (champ) => {
    const isVisible = visibleFields.includes(champ);
    const entrepriseId = entreprise.entreprise_id;

    const { error } = await supabase
      .from('champs_visibles')
      .upsert({
        entreprise_id: entrepriseId,
        nom_champ: champ,
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntreprise((prev) => ({
      ...prev,
      [name]: typeof value === 'string' ? value : value.toString(),
    }));
  };

  const handleSave = async () => {
    if (!entreprise) return;

    // 🟢 Champs standards uniquement (d'après ta table entreprises_clients)
    const champsStandards = [
      "id", "siren", "site_web", "notes", "entreprise_id", "created_by", "created_at",
      "adresse_entreprise_rue", "adresse_entreprise_cp", "adresse_entreprise_ville", "adresse_entreprise_pays",
      "email_professionnel", "telephone_professionnel", "siret", "raison_sociale", "forme_juridique",
      "capital_social", "date_immatriculation", "siege_social_rue", "siege_social_cp",
      "siege_social_ville", "siege_social_pays", "naf_code", "naf_label",
      "statut_entreprise", "numero_rcs", "dernier_traitement", "categorie_juridique_code",
      "categorie_entreprise", "annee_categorie_entreprise", "date_derniere_mise_a_jour", "updated_at"
    ];

    // 🟡 Séparer les champs
    const payload = {};
    const champsPerso = [];

    for (const key in entreprise) {
      const value = entreprise[key];
      if (champsStandards.includes(key)) {
        payload[key] = value;
      } else {
        champsPerso.push({ nom_champ: key, valeur: value });
      }
    }

    // ✅ Met à jour les champs standards dans entreprises_clients
    const { error: updateError } = await supabase
      .from('entreprises_clients')
      .update({ ...payload, ...adresseRef.current })
      .eq('id', id)
      .select();

    if (updateError) {
      alert("Erreur lors de la mise à jour : " + updateError.message);
      return;
    }

    // ✅ Enregistre ou met à jour les valeurs des champs personnalisés
    for (const champ of champsPerso) {
      console.log("📤 Sauvegarde champ personnalisé :", {
        entreprise_client_id: id,
        nom_champ: champ.nom_champ,
        valeur: champ.valeur
      });

      const { error: valeurErr } = await supabase
        .from('valeurs_champs_personnalises')
        .upsert({
          entreprise_client_id: id,
          nom_champ: champ.nom_champ,
          valeur: champ.valeur
        }, {
          onConflict: ['entreprise_client_id', 'nom_champ']
        });

      if (valeurErr) {
        console.error("❌ Erreur champ personnalisé :", champ.nom_champ, valeurErr.message);
      } else {
        console.log("✅ Champ enregistré ou mis à jour :", champ.nom_champ);
      }
    }

    localStorage.setItem('leadUpdated', 'true');
    navigate('/leads');
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
  <div className="lead-detail-page">
    <DashboardNavbar />
    {(isLoading || isFetchingInsee) && (
      <div className="overlay-loading">
        <div className="spinner" />
      </div>
    )}
    <div className="lead-detail-body">
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
          .map(({ label, name, type = "text", options = [] }) => (
            <div
              className="lead-field"
              key={name}
              style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}
            >
              <label htmlFor={name}>{label}</label>
              {type === 'select' ? (
                <select
                  id={name}
                  name={name}
                  value={entreprise[name] || ''}
                  onChange={handleChange}
                >
                  <option value="">-- Sélectionner --</option>
                  {options.map(opt => {
                    const [label, color] = opt.split('|');
                    return (
                      <option key={label} value={label} style={{ color: color || 'black' }}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              ) : type === 'textarea' ? (
                <textarea
                  id={name}
                  name={name}
                  value={entreprise[name] || ''}
                  onChange={handleChange}
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
          <input
            type="text"
            value={
              entreprise.updated_at
                ? new Date(entreprise.updated_at).toLocaleString()
                : "Non modifié"
            }
            readOnly
          />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>Enregistrer</button>
        <button className="delete-btn" onClick={handleDelete}>Supprimer</button>
      </div>

      {fieldSettingsOpen && (
        <div className="drawer-overlay" onClick={() => setFieldSettingsOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Champs visibles</h2>
            <div className="custom-field-creator">
              <input
                type="text"
                placeholder="Ajouter un champ"
                value={newField.nom_affichage}
                onChange={e =>
                  setNewField({
                    ...newField,
                    nom_affichage: e.target.value,
                    nom_champ: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                  })
                }
              />

              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
              >
                <option value="text">Texte</option>
                <option value="date">Date</option>
                <option value="select">Menu déroulant</option>
              </select>

              {newField.type === 'select' && (
                <input
                  type="text"
                  placeholder="Options séparées par des virgules (ex: Option 1, Option 2)"
                  value={newField.options || ''}
                  onChange={(e) =>
                    setNewField({ ...newField, options: e.target.value })
                  }
                />
              )}

              <button
                onClick={async () => {
                  if (!newField.nom_affichage.trim()) return;
                  if (!entreprise?.entreprise_id) {
                    alert("Impossible d'ajouter un champ sans entreprise_id.");
                    return;
                  }

                  const { error } = await supabase.from('champs_personnalises').insert({
                    entreprise_id: entreprise.entreprise_id,
                    nom_affichage: newField.nom_affichage,
                    nom_champ: newField.nom_champ,
                    type: newField.type,
                    type_fiche: 'entreprise',
                    options:
                      newField.type === 'select'
                        ? newField.options.split(',').map((opt) => opt.trim())
                        : null,
                  });

                  if (!error) {
                    const { data: updatedFields } = await supabase
                      .from('champs_personnalises')
                      .select('*')
                      .eq('entreprise_id', entreprise.entreprise_id)
                      .eq('type_fiche', 'entreprise');
                    setCustomFields(updatedFields || []);
                    setNewField({ nom_affichage: '', nom_champ: '', type: 'text', options: '' });
                  }
                }}
              >
                Ajouter le champ
              </button>
            </div>

              <ul className="custom-field-list">
              {baseFields.map((field) => (
                <li key={field.name} className="custom-field-item">
                  <span>{field.label}</span>
                  <button
                    onClick={() => toggleFieldVisibility(field.name)}
                    title="Afficher / Masquer"
                  >
                    {visibleFields.includes(field.name) ? <FiEye /> : <FiEyeOff />}
                  </button>
                </li>
              ))}
            </ul>


            {customFields.map((field, index) => (
              <li key={field.nom_champ} className="custom-field-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Nom affiché :</label>
                  <input
                    className="custom-field-input"
                    type="text"
                    value={field.nom_affichage}
                    onChange={async (e) => {
                      const newValue = e.target.value;
                      const updated = [...customFields];
                      updated[index].nom_affichage = newValue;
                      setCustomFields(updated);

                      const { error } = await supabase
                        .from('champs_personnalises')
                        .update({ nom_affichage: newValue })
                        .eq('id', field.id);

                      if (error) {
                        alert("Erreur lors de la mise à jour du nom affiché : " + error.message);
                      }
                    }}
                  />

                {field.type === 'select' && (
                  <>
                    <div className="custom-field-options-wrapper">
                      <label style={{ marginBottom: '0.25rem' }}>Options :</label>
                      <div className="tag-container">
                        {field.options?.map((opt, i) => (
                          <span key={i} className="tag">
                            {opt}
                          <button
                            className="remove-tag"
                            onClick={async () => {
                              const updated = [...customFields];
                              updated[index].options = updated[index].options.filter((_, j) => j !== i);
                              setCustomFields(updated);

                              // ➤ Sauvegarde dans Supabase
                              const { error } = await supabase
                                .from('champs_personnalises')
                                .update({
                                  options: updated[index].options
                                })
                                .eq('id', field.id);

                              if (error) {
                                alert("Erreur lors de la suppression : " + error.message);
                              }
                            }}
                          >
                            &times;
                          </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Ajouter une option"
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            const newOption = e.target.value.trim();
                            const updated = [...customFields];

                            // évite les doublons
                            if (!updated[index].options.includes(newOption)) {
                              updated[index].options = [...updated[index].options, newOption];
                              setCustomFields(updated);

                              // ➤ Envoie dans Supabase
                              const { error } = await supabase
                                .from('champs_personnalises')
                                .update({
                                  options: updated[index].options
                                })
                                .eq('id', field.id);

                              if (error) {
                                alert("Erreur lors de l'ajout de l'option : " + error.message);
                              }
                            }

                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    title="Enregistrer"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('champs_personnalises')
                        .update({
                          nom_affichage: customFields[index].nom_affichage,
                          options: customFields[index].options || null
                        })
                        .eq('id', field.id);

                      if (error) {
                        alert("Erreur lors de la sauvegarde : " + error.message);
                      } else {
                        alert("Champ mis à jour !");
                      }
                    }}
                  >
                    <FiSave />
                  </button>
                  <button
                    onClick={() => toggleFieldVisibility(field.nom_champ)}
                    title="Afficher / Masquer"
                  >
                    {visibleFields.includes(field.nom_champ) ? <FiEye /> : <FiEyeOff />}
                  </button>
                  <button
                    title="Supprimer"
                    style={{ color: 'red' }}
                    onClick={async () => {
                      if (!window.confirm('Supprimer ce champ ?')) return;

                      const { error } = await supabase
                        .from('champs_personnalises')
                        .delete()
                        .eq('id', field.id);

                      if (error) {
                        alert("Erreur lors de la suppression : " + error.message);
                      } else {
                        // Met à jour les champs côté frontend
                        setCustomFields(prev => prev.filter(f => f.id !== field.id));
                        setVisibleFields(prev => prev.filter(v => v !== field.nom_champ));
                      }
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}

            <div className="drawer-buttons">
              <button className="cancel-btn" onClick={() => setFieldSettingsOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  </>
  );
}