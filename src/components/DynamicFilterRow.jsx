import React from 'react';

export default function DynamicFilterRow({ filter, index, fields, onChange, onRemove }) {
  const { field, operator, value } = filter;

  return (
    <div className="filter-row">
      <select value={field} onChange={(e) => onChange(index, { ...filter, field: e.target.value })}>
        <option value="">-- champ --</option>
        {fields.map(f => (
          <option key={f.label} value={f.key}>{f.label}</option>
        ))}
      </select>

      <select value={operator} onChange={(e) => onChange(index, { ...filter, operator: e.target.value })}>
        <option value="">-- condition --</option>
        <option value="contains">contient</option>
        <option value="not_contains">ne contient pas</option>
        <option value="equals">est</option>
        <option value="not_equals">n'est pas</option>
        <option value="empty">est vide</option>
        <option value="not_empty">n'est pas vide</option>
      </select>

      {!['empty', 'not_empty'].includes(operator) && (
        <input
          type="text"
          placeholder="valeur"
          value={value}
          onChange={(e) => onChange(index, { ...filter, value: e.target.value })}
        />
      )}

      <button className="remove-filter-btn" onClick={() => onRemove(index)}>✕</button>
    </div>
  );
}
