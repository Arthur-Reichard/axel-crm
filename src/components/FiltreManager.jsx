// components/FiltreManager.jsx
import React, { useRef } from "react";
import TagInput from "./TagInput";
import "./css/FiltreManager.css";
import FilterGroupManager from "./FilterGroupManager";

export default function FiltreManager({
  userId,
  entrepriseId,
  filtres,
  locked,
  champs,
  valeursPossibles,
  onAdd,
  onChange,
  onRemove,
  onValidate,
  onEdit
}) {
  const tagRefs = useRef([]);
  const renderRésumé = () => {
    return (
      <div className="resume-filtres">
        {filtres.map((filtre, i) => {
          const labelChamp = champs.find(c => c.champ === filtre.champ)?.label || filtre.champ;
          const valeurs = (filtre.valeur || []).join(", ");
          return (
            <div key={i} className="filtre-resume-item">
              <strong>{labelChamp}</strong> {filtre.type} <em>{valeurs}</em>
            </div>
          );
        })}
        <button className="btn-edit" onClick={onEdit}>Modifier les filtres</button>
      </div>
    );
  };

  return (
    <div className="filtre-manager">
      <div className="filtre-header">
        <h4>Filtres</h4>
        {!locked && (
          <button className="btn-add" onClick={onAdd}>Ajouter un filtre</button>
        )}
      </div>

      <FilterGroupManager
        userId={userId}
        entrepriseId={entrepriseId}
        filtres={filtres}
        onLoadFiltres={(f) => {
          onEdit();
          onValidate();
          f.forEach((filtre, i) => onChange(i, "champ", filtre.champ));
        }}
        mode={locked ? "view" : "edit"}
        hasFilters={filtres.length > 0}
      />

      {locked ? (
        renderRésumé()
      ) : (
        <>
          {filtres.map((filtre, i) => (
            <div className="filtre-row" key={i}>
              <select
                value={filtre.champ}
                onChange={(e) => onChange(i, "champ", e.target.value)}
              >
                <option value="">-- Champ --</option>
                {champs.map(c => (
                  <option key={c.champ} value={c.champ}>{c.label}</option>
                ))}
              </select>

              <select
                value={filtre.type}
                onChange={(e) => onChange(i, "type", e.target.value)}
              >
                <option value="contient">contient</option>
                <option value="ne_contient_pas">ne contient pas</option>
                <option value="egal">égal</option>
              </select>

                <TagInput
                  tags={filtre.valeur || []}
                  setTags={(tags) => onChange(i, "valeur", tags)}
                  placeholder="Valeurs..."
                  suggestions={valeursPossibles[filtre.champ] || []}
                />

              <button onClick={() => onRemove(i)} className="btn-delete">supprimer</button>
            </div>
          ))}

          <div className="filtre-actions">
            {filtres.length > 0 && (
              <button
              className="btn-validate"
              onClick={() => {
                tagRefs.current.forEach(ref => ref?.flushInput?.());
                onValidate();
              }}
            >
              Valider les filtres
            </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
