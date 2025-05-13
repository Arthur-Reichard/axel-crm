import React from 'react';

export default function DynamicFilterRow({ filter, index, onChange, onRemove, onConfirm }) {
  const { field, operator, value } = filter;

const handleFieldChange = (e) => {
  if (!e.target.value) {
    onChange(index, { ...filter, field: '', value: '' });
    return;
  }

  try {
    const selectedField = JSON.parse(e.target.value);
    onChange(index, { ...filter, field: selectedField, value: '' });
  } catch (err) {
    console.error("Erreur JSON.parse sur le champ sélectionné :", e.target.value);
  }
};

const handleOperatorChange = (e) => {
  onChange(index, { ...filter, operator: e.target.value });
};

  const handleValueChange = (e) => {
    onChange(index, { ...filter, value: e.target.value });
  };

  const isReadyToApply = field && operator && (['empty', 'not_empty'].includes(operator) || value?.toString().trim());

  const fieldOptions = filter?.field?.options || [];
  const type = filter?.field?.type;

  return (
    <div className="filter-row">
      <select value={JSON.stringify(field)} onChange={handleFieldChange}>
        <option value="">-- champ --</option>
        {filter.availableFields?.map(f => (
          <option key={f.name} value={JSON.stringify(f)}>{f.label}</option>
        ))}
      </select>

      <select value={operator} onChange={handleOperatorChange}>
        <option value="">-- condition --</option>
        <option value="contains">contient</option>
        <option value="not_contains">ne contient pas</option>
        <option value="equals">est</option>
        <option value="not_equals">n'est pas</option>
        <option value="empty">est vide</option>
        <option value="not_empty">n'est pas vide</option>
      </select>

      {!['empty', 'not_empty'].includes(operator) && (
        type === 'date' ? (
          <input type="date" value={value} onChange={handleValueChange} />
        ) : type === 'select' ? (
          <select value={value} onChange={handleValueChange}>
            <option value="">-- valeur --</option>
            {fieldOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input type="text" placeholder="valeur" value={value} onChange={handleValueChange} />
        )
      )}

      <button className="remove-filter-btn" onClick={() => onRemove(index)}>Annuler</button>

      <button
        className="apply-filter-btn"
        onClick={() => onConfirm(index)}
        disabled={!isReadyToApply}
      >
        Appliquer
      </button>
    </div>
  );
}