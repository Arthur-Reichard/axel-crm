import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../helper/supabaseClient";
import "./css/EmailSenderPopup.css";

export default function EmailSenderPopup({ campagne, onClose, userId, entrepriseId }) {
  const [objet, setObjet] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [champSelectionne, setChampSelectionne] = useState("");
  const [leads, setLeads] = useState([]);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [resultats, setResultats] = useState([]);
  const [previewTexte, setPreviewTexte] = useState(null);
  const editorRef = useRef(null);

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
        .select("id, email_professionnel, prenom, nom, poste_contact, adresse_entreprise_ville")
        .eq("entreprise_id", entrepriseId);

      if (!error && data) {
        setLeads(data.filter((l) => l.email_professionnel));
      }
    };

    fetchLeads();
  }, [entrepriseId]);

  useEffect(() => {
    if (editorRef.current && messageHtml) {
      editorRef.current.innerHTML = messageHtml;
    }
  }, []);

  const insererChamp = () => {
    if (!champSelectionne) return;

    const editor = editorRef.current;
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    const span = document.createElement("span");
    span.className = "token-dynamique";
    span.contentEditable = "false";
    span.dataset.champ = champSelectionne;
    span.innerHTML = `${champSelectionne} <button class="close-btn" onclick="this.parentElement.remove()">×</button>`;

    const space = document.createTextNode("\u00A0");
    const fakeCaret = document.createElement("span");
    fakeCaret.textContent = "\u200B";
    fakeCaret.id = "caret-position";

    if (range && editor.contains(selection.anchorNode)) {
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.insertNode(space);
      range.setStartAfter(space);
      range.insertNode(fakeCaret);
    } else {
      editor.appendChild(span);
      editor.appendChild(space);
      editor.appendChild(fakeCaret);
    }

    setTimeout(() => {
      const caret = document.getElementById("caret-position");
      if (caret) {
        const newRange = document.createRange();
        newRange.setStartAfter(caret);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
        caret.remove();
      }
    }, 0);

    setMessageHtml(editor.innerHTML);
  };

  const convertirHtmlEnTexte = () => {
    const container = document.createElement("div");
    container.innerHTML = editorRef.current.innerHTML;

    container.querySelectorAll(".token-dynamique").forEach((el) => {
      const champ = el.dataset.champ;
      const placeholder = document.createTextNode(`{{${champ}}}`);
      el.replaceWith(placeholder);
    });

    return container.textContent;
  };

  const genererApercu = () => {
    if (previewTexte) {
      setPreviewTexte(null);
      return;
    }

    const texteBrut = convertirHtmlEnTexte();
    if (!leads.length) return;
    const lead = leads[0];

    const texteAvecDonnees = texteBrut.replace(/{{(\w+?)}}/g, (_, champ) => lead[champ] || "");
    setPreviewTexte(texteAvecDonnees);
  };

  const envoyerEmails = async () => {
    setEnvoiEnCours(true);
    const resultatsEnvois = [];
    const messageFinal = convertirHtmlEnTexte();

    for (const lead of leads) {
      await new Promise((res) => setTimeout(res, 300));

      const { error } = await supabase.from("emails_envoyes").insert({
        campagne_id: campagne.id,
        lead_id: lead.id,
        email_envoye_a: lead.email_professionnel,
        objet,
        message: messageFinal,
        statut_envoi: "envoyé",
        envoye_par: userId,
        entreprise_id: entrepriseId,
      });

      resultatsEnvois.push({
        email: lead.email_professionnel,
        statut: error ? "Échec" : "Envoyé",
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

        <div className="inserer-champ">
          <label>Insérer un champ dynamique :</label>
          <select value={champSelectionne} onChange={(e) => setChampSelectionne(e.target.value)}>
            <option value="">-- choisir --</option>
            {champsDynamiqueDisponibles.map((champ) => (
              <option key={champ.value} value={champ.value}>{champ.label}</option>
            ))}
          </select>
          <button className="btn-ajouter" onClick={insererChamp}>+ Ajouter</button>
        </div>

        <div
          id="message-editor"
          ref={editorRef}
          dir="ltr"
          className="champ-texte message-editor"
          contentEditable
          onInput={() => setMessageHtml(editorRef.current.innerHTML)}
        ></div>

        <button className="btn-ajouter" onClick={genererApercu}>
          {previewTexte ? "Fermer l'aperçu" : "Aperçu du message"}
        </button>

        {previewTexte && (
          <div className="email-leads-preview">
            <h4>Aperçu du message :</h4>
            <pre>{previewTexte}</pre>
          </div>
        )}

        <div className="email-leads-preview">
          <h4>Leads ciblés ({leads.length}) :</h4>
          <ul>
            {leads.map((lead) => (
              <li key={lead.id}>{lead.email_professionnel}</li>
            ))}
          </ul>
        </div>

        {resultats.length > 0 && (
          <div className="resultats-envois">
            <h4>Résultats :</h4>
            {resultats.map((r, i) => (
              <div key={i}>{r.email} - {r.statut}</div>
            ))}
          </div>
        )}

        <div className="footer">
          <button onClick={onClose} className="btn-secondaire">Annuler</button>
          <button
            onClick={envoyerEmails}
            className="btn-principal"
            disabled={envoiEnCours || !objet || !messageHtml}
          >
            {envoiEnCours ? "Envoi en cours..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}