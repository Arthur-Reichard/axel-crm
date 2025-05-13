// FilterDrawer.jsx - version améliorée avec meilleures UX/UI
import React from 'react';
import './css/FilterDrawer.css';
import DynamicFilterRow from './DynamicFilterRow';
import { FiX } from 'react-icons/fi';

export default function FilterDrawer({ isOpen, onClose, filters, setFilters, availableFields, filteredCount }) {
  const handleChange = (index, updated) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updated, availableFields };
    setFilters(updatedFilters);
  };

  const handleAddInputRow = () => {
    if (!filters.some(f => !f.confirmed)) {
      setFilters([
        ...filters,
        { field: '', operator: '', value: '', availableFields, confirmed: false }
      ]);
    }
  };

  const handleRemoveFilter = (index) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
  };

  const handleConfirmFilter = (index) => {
    const updated = [...filters];
    updated[index].confirmed = true;
    setFilters(updated);
  };

  const handleClear = () => setFilters([]);

  const inputRow = filters.find(f => !f.confirmed);
  const confirmedFilters = filters.filter(f => f.confirmed);

  return isOpen && (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer left" onClick={(e) => e.stopPropagation()}>
        <h2>Filtres actifs</h2>

        {!inputRow && (
          <button className="add-filter-btn" onClick={handleAddInputRow}>
            + Ajouter un filtre
          </button>
        )}

        {inputRow && (
          <DynamicFilterRow
            index={filters.indexOf(inputRow)}
            filter={inputRow}
            onChange={handleChange}
            onRemove={handleRemoveFilter}
            onConfirm={handleConfirmFilter}
          />
        )}

        <div className="confirmed-filters-list">
          {confirmedFilters.length === 0 && <em>Aucun filtre appliqué</em>}
          {confirmedFilters.map((f, i) => (
            <div key={i} className="filter-badge">
              <span>
                {f.field?.label || '—'} {f.operator.replace('_', ' ')}{' '}
                {!['empty', 'not_empty'].includes(f.operator) && f.value}
              </span>
              <button className="remove-filter-inline" onClick={() => handleRemoveFilter(filters.indexOf(f))}>
                <FiX />
              </button>
            </div>
          ))}
        </div>

        {filteredCount != null && (
          <div className="filtered-count">
            <em>{filteredCount} prospect(s) correspondant(s)</em>
          </div>
        )}

        <div className="drawer-buttons">
          <button onClick={onClose}>Fermer</button>
          <button className="cancel-btn" onClick={handleClear}>Tout réinitialiser</button>
        </div>
      </div>
    </div>
  );
}