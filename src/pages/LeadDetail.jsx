import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../helper/supabaseClient';
import '../pages/css/Leads.css';
import '../pages/css/LeadDetail.css';
import { FiEye, FiEyeOff, FiSettings, FiSave, FiTrash2 } from 'react-icons/fi';
import AdresseAutocomplete from '../components/AdresseAutocomplete';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientType = searchParams.get("type") || "individuel";
  const adresseRef = useRef({});
  const [membresEntreprise, setMembresEntreprise] = useState([]);

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customFields, setCustomFields] = useState([]);
  const [visibleFields, setVisibleFields] = useState([]);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(false);
  const [newField, setNewField] = useState({ nom_affichage: '', nom_champ: '', type: 'text' });
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [entreprisesClients, setEntreprisesClients] = useState([]);
  const availableFields = [
    { label: "Nom", name: "nom" },
    { label: "Prénom", name: "prenom" },
    { label: "Email professionnel", name: "email_professionnel" },
    { label: "Téléphone professionnel", name: "telephone_professionnel" },
    { label: "Nom de l'entreprise", name: "nom_entreprise" },
    { label: "Assigné à", name: "assigne_a" },
    { label: "Statut", name: "status" },
    { label: "Source", name: "source" },
    { label: "Notes", name: "notes", type: "textarea" },
    { label: "Description", name: "description", type: "textarea" },
    { label: "Poste contact", name: "poste_contact" },
    { label: "Site web", name: "site_web" },
    { label: "Canal préféré", name: "canal_prefere" },
    { label: "Langue", name: "langue" },
    { label: "Origine contact", name: "origine_contact" },
    { label: "Statut client", name: "statut_client" },
    { label: "Date premier contact", name: "date_premier_contact", type: "date" },
    { label: "Date dernier contact", name: "date_dernier_contact", type: "date" },
    { label: "Historique commandes", name: "historique_commandes", type: "textarea" },
    { label: "Devis envoyés", name: "devis_envoyes" },
    { label: "Statut paiement", name: "statut_paiement" },
    { label: "Niveau priorité", name: "niveau_priorite" },
    { label: "Documents", name: "documents", type: "textarea" }
  ];


  const allFields = useMemo(() => {
    const customFieldNames = customFields.map(f => f.nom_champ);
    const filteredBaseFields = availableFields.filter(f => !customFieldNames.includes(f.name));

    return [
      ...filteredBaseFields,
      ...customFields.map(f => ({
        label: f.nom_affichage,
        name: f.nom_champ,
        type: f.type
      }))
    ];
  }, [customFields, availableFields]);

  useEffect(() => {
    const fetchEntreprises = async () => {
      const { data, error } = await supabase
        .from('entreprises_clients')
        .select('id, raison_sociale')
        .order('raison_sociale', { ascending: true });

      if (!error && data) {
        setEntreprisesClients(data);
      }
    };

    fetchEntreprises();
  }, []);


useEffect(() => {
  const fetchAll = async () => {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.log("Erreur utilisateur :", userErr);
      return;
    }


    const { data: utilisateur, error: utilisateurErr } = await supabase
      .from('utilisateurs')
      .select('entreprise_id')
      .eq('id', user.id)
      .single();

    if (utilisateurErr || !utilisateur) {
      console.log("Erreur récupération utilisateur/entreprise :", utilisateurErr);
      return;
    }

    setEntrepriseId(utilisateur.entreprise_id);

    // → On récupère le lead d'abord pour savoir s'il a un assigné
    const { data: leadData, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadErr || !leadData) {
      console.log("Erreur récupération lead :", leadErr);
      return;
    }

    setLead(leadData);

    // → On récupère tous les membres de l'entreprise
    const { data: membres, error: membresErr } = await supabase
      .from('utilisateurs')
      .select('id, email')
      .eq('entreprise_id', utilisateur.entreprise_id);

    let membresFinal = membres || [];

    // → Si le lead a un assigne_a qui n'est pas dans les membres
    if (
      leadData.assigne_a &&
      !membresFinal.find((m) => m.id === leadData.assigne_a)
    ) {
      console.log("Lead assigné à un membre manquant :", leadData.assigne_a);

      const { data: membreManquant, error: membreErr } = await supabase
        .from('utilisateurs')
        .select('id, email')
        .eq('id', leadData.assigne_a)
        .single();

      if (!membreErr && membreManquant) {
        console.log("Membre assigné récupéré :", membreManquant);
        membresFinal = [...membresFinal, membreManquant];
      } else {
        console.log("Erreur récupération membre assigné :", membreErr);
      }
    }

    setMembresEntreprise(membresFinal);

    // Champs personnalisés
    const { data: custom, error: customErr } = await supabase
      .from('champs_personnalises')
      .select('*')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('type_fiche', 'lead');
    setCustomFields(custom || []);

    // Champs visibles
    const { data: visibles, error: visiblesErr } = await supabase
      .from('champs_visibles')
      .select('nom_champ')
      .eq('entreprise_id', utilisateur.entreprise_id)
      .eq('type_fiche', 'lead')
      .eq('visible', true);

    if (visiblesErr) {
      console.log("Erreur récupération champs visibles :", visiblesErr);
    }

    if (visibles?.length > 0) {
      setVisibleFields(visibles.map(v => v.nom_champ));
    } else {
      const defaultVisible = [
        "nom",
        "prenom",
        "email_professionnel",
        "telephone_professionnel",
        "nom_entreprise",
        "assigne_a",
        "status",
        "source",
        "notes",
        "description"
      ];

      setVisibleFields(defaultVisible);

      const inserts = [
        ...availableFields.map(f => f.name),
        ...custom.map(f => f.nom_champ)
      ].map(nom => ({
        entreprise_id: utilisateur.entreprise_id,
        nom_champ: nom,
        visible: defaultVisible.includes(nom),
        type_fiche: 'lead'
      }));

      await supabase.from('champs_visibles').insert(inserts);
    }

    setLoading(false);
  };

  fetchAll();
}, [id]);


  const handleChange = (e) => {
    setLead(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const payload = {
      ...lead,
      ...adresseRef.current
    };
    const { error } = await supabase.from('leads').update(payload).eq('id', id);
    if (!error) {
      localStorage.setItem('leadUpdated', 'true');
      navigate('/leads');
    }
  };

  const toggleFieldVisibility = async (champ) => {
    const isVisible = visibleFields.includes(champ);
    const { error } = await supabase
      .from('champs_visibles')
      .upsert({
        entreprise_id: entrepriseId,
        nom_champ: champ,
        visible: !isVisible,
        type_fiche: 'lead'
      }, { onConflict: ['entreprise_id', 'nom_champ', 'type_fiche'] });

    if (!error) {
      const { data } = await supabase
        .from('champs_visibles')
        .select('nom_champ')
        .eq('entreprise_id', entrepriseId)
        .eq('type_fiche', 'lead')
        .eq('visible', true);
      setVisibleFields(data.map(v => v.nom_champ));
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Supprimer ce prospect ?")) {
      await supabase.from('leads').delete().eq('id', id);
      navigate('/leads');
    }
  };

  if (loading || !lead) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div className="lead-detail-page">
      <div className="lead-detail-header">
        <h1>Fiche du Prospect</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate(`/leads?type=${clientType}`)}>← Retour</button>
          <button onClick={() => setFieldSettingsOpen(true)} className="settings-btn">
            <FiSettings size={22} />
          </button>
        </div>
      </div>

      <div className="lead-detail-grid">
        {allFields
          .filter(f => visibleFields.includes(f.name))
          .map(({ label, name, type = 'text', options = [] }) => (
            <div key={name} className="lead-field" style={{ gridColumn: type === "textarea" ? '1 / -1' : undefined }}>
              <label htmlFor={name}>{label}</label>
              {type === 'select' ? (
                <select name={name} value={lead[name] || ''} onChange={handleChange}>
                  <option value="">-- Sélectionner --</option>
                  {options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : type === 'textarea' ? (
                <textarea name={name} value={lead[name] || ''} onChange={handleChange} />
              ) : name === 'nom_entreprise' ? (
                <select
                  name="nom_entreprise"
                  value={lead.nom_entreprise || ''}
                  onChange={async (e) => {
                    const value = e.target.value;
                    if (value === '__new') {
                      const nouvelleEntreprise = prompt("Nom de la nouvelle entreprise :");
                      if (!nouvelleEntreprise) return;

                      const { data: { user } } = await supabase.auth.getUser();
                      const { data, error } = await supabase
                        .from('entreprises_clients')
                        .insert({
                          raison_sociale: nouvelleEntreprise,
                          created_by: user.id,
                          entreprise_id: entrepriseId
                        })
                        .select()
                        .single();

                      if (!error && data) {
                        setEntreprisesClients((prev) => [...prev, data]);
                        setLead((prev) => ({ ...prev, nom_entreprise: data.raison_sociale }));
                      } else {
                        alert("Erreur création entreprise");
                      }
                    } else {
                      setLead((prev) => ({ ...prev, nom_entreprise: value }));
                    }
                  }}
                >
                  <option value="">--Sélectionner une entreprise--</option>
                  {entreprisesClients.map((ent) => (
                    <option key={ent.id} value={ent.raison_sociale}>{ent.raison_sociale}</option>
                  ))}
                  <option value="__new">Ajouter une entreprise...</option>
                </select>
                ) : name === 'assigne_a' ? (
                  <select
                    name="assigne_a"
                    value={lead.assigne_a || ''}
                    onChange={handleChange}
                    style={{ color: '#111' }} // au cas où
                  >
                    <option value="">-- Sélectionner un membre --</option>
                    {membresEntreprise.map((membre) => (
                      <option key={membre.id} value={membre.id}>
                        {membre.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id={name} type={type} name={name} value={lead[name] || ''} onChange={handleChange} />
                )}
            </div>
        ))}
      </div>

            <div className="lead-field adresse-bloc">
        <label>Adresse (auto-complétée)</label>
        <AdresseAutocomplete
          onPlaceSelected={(place) => {
            const components = place.address_components || [];
            const get = (type) =>
              components.find((c) => c.types.includes(type))?.long_name || '';

            const newAdresse = {
              adresse_entreprise_rue: [get('street_number'), get('route')].filter(Boolean).join(' '),
              adresse_entreprise_ville: get('locality') || get('postal_town'),
              adresse_entreprise_cp: get('postal_code'),
              adresse_entreprise_pays: get('country')
            };

            adresseRef.current = newAdresse;
            setLead((prev) => ({ ...prev, ...newAdresse }));
          }}
        />
      </div>

      <div className="adresse-hidden-fields">
        <div className="lead-field">
          <label>Rue</label>
          <input type="text" name="adresse_entreprise_rue" value={lead.adresse_entreprise_rue || ''} disabled />
        </div>
        <div className="lead-field">
          <label>Ville</label>
          <input type="text" name="adresse_entreprise_ville" value={lead.adresse_entreprise_ville || ''} disabled />
        </div>
        <div className="lead-field">
          <label>Code Postal</label>
          <input type="text" name="adresse_entreprise_cp" value={lead.adresse_entreprise_cp || ''} disabled />
        </div>
        <div className="lead-field">
          <label>Pays</label>
          <input type="text" name="adresse_entreprise_pays" value={lead.adresse_entreprise_pays || ''} disabled />
        </div>
      </div>

      <div className="lead-detail-buttons">
        <button onClick={handleSave}>Enregistrer</button>
        <button onClick={handleDelete} className="delete-btn">Supprimer</button>
      </div>

      {fieldSettingsOpen && (
        <div className="drawer-overlay" onClick={() => setFieldSettingsOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <h2>Champs personnalisés</h2>

            <div className="custom-field-creator">
              <input
                type="text"
                placeholder="Ajouter un champ"
                value={newField.nom_affichage}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    nom_affichage: e.target.value,
                    nom_champ: e.target.value.toLowerCase().replace(/\s+/g, '_')
                  })
                }
              />
              <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })}>
                <option value="text">Texte</option>
                <option value="textarea">Zone de texte</option>
                <option value="date">Date</option>
                <option value="select">Menu déroulant</option>
              </select>
              {newField.type === 'select' && (
                <input
                  type="text"
                  placeholder="Options séparées par des virgules"
                  value={newField.options || ''}
                  onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                />
              )}
              <button onClick={async () => {
                if (!newField.nom_affichage.trim()) return;

                const { error } = await supabase.from('champs_personnalises').insert({
                  entreprise_id: entrepriseId,
                  nom_affichage: newField.nom_affichage,
                  nom_champ: newField.nom_champ,
                  type: newField.type,
                  options: newField.type === 'select'
                    ? newField.options.split(',').map(o => o.trim())
                    : null,
                  type_fiche: 'lead'
                });

                if (!error) {
                  const { data } = await supabase
                    .from('champs_personnalises')
                    .select('*')
                    .eq('entreprise_id', entrepriseId)
                    .eq('type_fiche', 'lead');
                  setCustomFields(data || []);
                  setNewField({ nom_affichage: '', nom_champ: '', type: 'text', options: '' });
                }
              }}>Ajouter le champ</button>
            </div>

            <ul className="custom-field -list">
              {/* Champs standards */}
              {availableFields.map((field) => (
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
            {/* Champs personnalisés */}
              {customFields.map((field, index) => (
                <li key={field.nom_champ} className="custom-field-item" style={{ flexDirection: 'column' }}>
                  <label style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Nom affiché :</label>
                  <input
                    className="custom-field-input"
                    type="text"
                    value={field.nom_affichage}
                    onChange={async (e) => {
                      const updated = [...customFields];
                      updated[index].nom_affichage = e.target.value;
                      setCustomFields(updated);

                      await supabase
                        .from('champs_personnalises')
                        .update({ nom_affichage: e.target.value })
                        .eq('id', field.id);
                    }}
                  />

                  {field.type === 'select' && (
                    <>
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
                                await supabase
                                  .from('champs_personnalises')
                                  .update({ options: updated[index].options })
                                  .eq('id', field.id);
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
                            const value = e.target.value.trim();
                            const updated = [...customFields];
                            if (!updated[index].options.includes(value)) {
                              updated[index].options.push(value);
                              setCustomFields(updated);
                              await supabase
                                .from('champs_personnalises')
                                .update({ options: updated[index].options })
                                .eq('id', field.id);
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                    </>
                  )}

                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }} className="custom-field-options-wrapper">
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from('champs_personnalises')
                          .update({
                            nom_affichage: field.nom_affichage,
                            options: field.options || null
                          })
                          .eq('id', field.id);

                        if (error) {
                          alert("Erreur lors de la sauvegarde : " + error.message);
                        } else {
                          alert("Champ mis à jour !");
                        }
                      }}
                      title="Enregistrer"
                    >
                      <FiSave />
                    </button>

                    <button
                      onClick={() => toggleFieldVisibility(field.nom_champ)}
                      title="Afficher/Masquer"
                    >
                      {visibleFields.includes(field.nom_champ) ? <FiEye /> : <FiEyeOff />}
                    </button>

                    <button
                      onClick={async () => {
                        if (!window.confirm("Supprimer ce champ ?")) return;
                        await supabase.from('champs_personnalises').delete().eq('id', field.id);
                        setCustomFields(prev => prev.filter(f => f.id !== field.id));
                        setVisibleFields(prev => prev.filter(c => c !== field.nom_champ));
                      }}
                      style={{ color: 'red' }}
                      title="Supprimer"
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
  );
}