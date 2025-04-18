// src/components/EntitySelector.jsx
import React, { useState } from "react";
import { supabase } from "../helper/supabaseClient";

function EntitySelector({ userId, onEntityLinked }) {
  const [mode, setMode] = useState("create"); // "create" ou "join"
  const [entityType, setEntityType] = useState("");
  const [entityName, setEntityName] = useState("");
  const [siren, setSiren] = useState("");
  const [rna, setRna] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async () => {
    if (!entityName || !entityType) {
      alert("Merci de sélectionner un type d'entité et d'entrer un nom.");
      return;
    }

    let entrepriseData = { nom: entityName, type: entityType };
    if (entityType === "entreprise") {
      if (!/^[0-9]{9}$/.test(siren)) {
        alert("Le numéro SIREN doit contenir exactement 9 chiffres.");
        return;
      }
      entrepriseData.siren = siren;
    }
    if (entityType === "association" && rna) entrepriseData.rna = rna;

    const { data: newEntreprise, error: entrepriseError } = await supabase
      .from("entreprises")
      .insert([entrepriseData])
      .select()
      .single();

    if (entrepriseError) {
      alert("Erreur lors de la création de l'entité : " + entrepriseError.message);
      return;
    }

    const { error: userUpdateError } = await supabase
    .from("utilisateurs")
    .update({ entreprise_id: newEntreprise.id, role: "admin" })
    .eq("id", userId);
  

    if (userUpdateError) {
      alert("Erreur lors de l'association de l'utilisateur : " + userUpdateError.message);
    } else {
      onEntityLinked();
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) {
      alert("Merci d’entrer un code d’invitation.");
      return;
    }
  
    const { data: codeData, error: codeError } = await supabase
      .from("codes_invitation")
      .select("entreprise_id, expire_le, utilise")
      .eq("code", inviteCode)
      .single();
  
    if (codeError || !codeData) {
      alert("Code d’invitation invalide.");
      return;
    }
  
    const now = new Date();
    const expireDate = new Date(codeData.expire_le);
  
    if (codeData.utilise) {
      alert("Ce code a déjà été utilisé.");
      return;
    }
  
    if (expireDate < now) {
      alert("Ce code est expiré.");
      return;
    }
  
    const { error: updateError } = await supabase
    .from("utilisateurs")
    .update({ entreprise_id: codeData.entreprise_id, code_utilise: inviteCode })
    .eq("id", userId);
  
  
    if (updateError) {
      alert("Erreur lors de la liaison avec l’entité : " + updateError.message);
      return;
    }
  
    // Marquer le code comme utilisé
    await supabase
      .from("codes_invitation")
      .update({ utilise: true })
      .eq("code", inviteCode);
  
    onEntityLinked();
  };
  

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Bienvenue 👋</h2>
        <p>Avant de continuer, choisis une option :</p>

        <div className="mode-selector">
          <button onClick={() => setMode("create")} className={mode === "create" ? "selected" : ""}>Créer une entité</button>
          <button onClick={() => setMode("join")} className={mode === "join" ? "selected" : ""}>Rejoindre avec un code</button>
        </div>

        {mode === "create" && (
          <>
            <div className="entity-type-selector">
              <button onClick={() => setEntityType("entreprise")} className={entityType === "entreprise" ? "selected" : ""}>Entreprise</button>
              <button onClick={() => setEntityType("association")} className={entityType === "association" ? "selected" : ""}>Association</button>
              <button onClick={() => setEntityType("indépendant")} className={entityType === "indépendant" ? "selected" : ""}>Indépendant</button>
            </div>

            <input
              type="text"
              placeholder="Nom de l'entité"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
            />

            {entityType === "entreprise" && (
              <input
                type="text"
                placeholder="Numéro SIREN"
                value={siren}
                onChange={(e) => setSiren(e.target.value)}
              />
            )}

            {entityType === "association" && (
              <input
                type="text"
                placeholder="Numéro RNA"
                value={rna}
                onChange={(e) => setRna(e.target.value)}
              />
            )}

            <button onClick={handleCreate}>Créer et lier</button>
          </>
        )}

        {mode === "join" && (
          <>
            <input
              type="text"
              placeholder="Code d'invitation"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
            <button onClick={handleJoin}>Rejoindre</button>
          </>
        )}
      </div>
    </div>
  );
}

export default EntitySelector;
