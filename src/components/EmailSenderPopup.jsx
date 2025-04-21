import React, { useEffect, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/EmailSenderPopup.css";

export default function EmailSenderPopup({ campagne, onClose, userId, entrepriseId }) {
  const [objet, setObjet] = useState("");
  const [message, setMessage] = useState("");
  const [leads, setLeads] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultats, setResultats] = useState([]);
  const [champSelectionne, setChampSelectionne] = useState("");

  const champsDynamiqueDisponibles = [
    { label: "Prénom", value: "prenom" },
    { label: "Nom", value: "nom" },
    { label: "Email", value: "email_professionnel" },
    { label: "Poste", value: "poste_contact" },
    { label: "Ville", value: "adresse_entreprise_ville" },
  ];

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, email_professionnel")
        .eq("entreprise_id", entrepriseId);

      if (!error && data) {
        setLeads(data.filter((l) => l.email_professionnel));
      }
    };

    fetchLeads();
  }, [entrepriseId]);

  const insererChamp = () => {
    if (!champSelectionne) return;
    const insertion = `{{${champSelectionne}}}`;
    const textarea = document.getElementById("message-editor");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newMessage = message.slice(0, start) + insertion + message.slice(end);
    setMessage(newMessage);

    // Replace le curseur à la bonne position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
    }, 0);
  };

  const envoyerEmails = async () => {
    setEnvoiEnCours(true);
    const resultatsEnvois = [];

    for (const lead of leads) {
      await new Promise((res) => setTimeout(res, 300));

      const { error } = await supabase.from("emails_envoyes").insert({
        campagne_id: campagne.id,
        lead_id: lead.id,
        email_envoye_a: lead.email_professionnel,
        objet,
        message,
        statut_envoi: "envoyé",
        envoye_par: userId,
        entreprise_id: entrepriseId,
      });

      resultatsEnvois.push({
        email: lead.email_professionnel,
        statut: error ? "❌ Échec" : "✅ Envoyé",
      });
    }

    setResultats(resultatsEnvois);
    setEnvoiEnCours(false);
  };

  return (
    <div className="popup">
      <div className="popup-content">
        <h2>Envoyer un e-mail aux leads</h2>

        <input
          type="text"
          placeholder="Objet de l'e-mail"
          className="champ-texte"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
        />

        {/* Champ dynamique */}
        <div className="inserer-champ">
          <label>Insérer un champ dynamique : </label>
          <select
            value={champSelectionne}
            onChange={(e) => setChampSelectionne(e.target.value)}
          >
            <option value="">-- choisir --</option>
            {champsDynamiqueDisponibles.map((champ) => (
              <option key={champ.value} value={champ.value}>
                {champ.label}
              </option>
            ))}
          </select>
          <button className="btn-ajouter" onClick={insererChamp}>+ Ajouter</button>
        </div>

        {/* Zone d'édition */}
        <textarea
          id="message-editor"
          className="champ-texte"
          placeholder="Contenu du message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Aperçu des leads */}
        <div className="email-leads-preview">
          <h4>Leads ciblés ({leads.length}) :</h4>
          <ul>
            {leads.map((lead) => (
              <li key={lead.id}>{lead.email_professionnel}</li>
            ))}
          </ul>
        </div>

        {/* Résultat après envoi */}
        {resultats.length > 0 && (
          <div className="resultats-envois">
            <h4>Résultats :</h4>
            {resultats.map((r, i) => (
              <div key={i}>
                {r.email} - {r.statut}
              </div>
            ))}
          </div>
        )}

        <div className="footer">
          <button onClick={onClose} className="btn-secondaire">Annuler</button>
          <button
            onClick={envoyerEmails}
            className="btn-principal"
            disabled={envoiEnCours || !objet || !message}
          >
            {envoiEnCours ? "Envoi en cours..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}