import React from 'react';
import './css/FilterDrawer.css';
import DynamicFilterRow from './DynamicFilterRow';
import { FiX } from 'react-icons/fi';

export default function FilterDrawer({ isOpen, onClose, filters, setFilters, availableFields, filteredCount }) {
  const handleChange = (index, updated) => {
    const copy = [...filters];
    copy[index] = { ...updated, availableFields };
    setFilters(copy);
  };

  const handleAddInputRow = () => {
    if (!filters.some(f => !f.confirmed)) {
      setFilters([...filters, { field: '', operator: '', value: '', availableFields, confirmed: false }]);
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

  const handleClear = () => {
    setFilters([]);
  };

  const handleApply = () => {
    onClose();
  };

  const inputRow = filters.find(f => !f.confirmed);
  const confirmedFilters = filters.filter(f => f.confirmed);

  return isOpen && (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer left" onClick={(e) => e.stopPropagation()}>
        <h2>Filtrer les leads</h2>

        {inputRow && (
          <DynamicFilterRow
            index={filters.indexOf(inputRow)}
            filter={inputRow}
            onChange={handleChange}
            onRemove={handleRemoveFilter}
            onConfirm={handleConfirmFilter}
          />
        )}

        <button className="add-filter-btn" onClick={handleAddInputRow}>+ Ajouter un filtre</button>

        {confirmedFilters.length > 0 && (
          <div className="active-filters-preview">
            <strong>Filtres actifs :</strong>
            <ul>
              {confirmedFilters.map((f, i) => (
                <li key={i}>
                  {f.field?.label || '—'} {f.operator.replace('_', ' ')} {['empty', 'not_empty'].includes(f.operator) ? '' : f.value}
                  <button
                    className="remove-filter-inline"
                    onClick={() => handleRemoveFilter(filters.indexOf(f))}
                  >
                    <FiX />
                  </button>
                </li>
              ))}
            </ul>
            <div className="filtered-count">
              {filteredCount != null && (
                <em>{filteredCount} prospect(s) correspondant(s)</em>
              )}
            </div>
          </div>
        )}

        <div className="drawer-buttons">
          <button onClick={handleApply}>Appliquer les filtres</button>
          <button className="cancel-btn" onClick={handleClear}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}