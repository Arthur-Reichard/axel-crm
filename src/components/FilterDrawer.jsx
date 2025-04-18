import React from 'react';
import './css/FilterDrawer.css';
import DynamicFilterRow from './DynamicFilterRow';

export default function FilterDrawer({ isOpen, onClose, filters, setFilters, availableFields }) {
  const handleChange = (index, updated) => {
    const copy = [...filters];
    copy[index] = updated;
    setFilters(copy);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: '', value: '' }]);
  };

  const handleRemoveFilter = (index) => {
    const copy = [...filters];
    copy.splice(index, 1);
    setFilters(copy);
  };

  const handleClear = () => {
    setFilters([]);
  };

  return isOpen && (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer left" onClick={(e) => e.stopPropagation()}>
        <h2>Filtrer les leads</h2>

        {filters.map((filter, index) => (
          <DynamicFilterRow
            key={index}
            index={index}
            filter={filter}
            fields={availableFields}
            onChange={handleChange}
            onRemove={handleRemoveFilter}
          />
        ))}

        <button className="add-filter-btn" onClick={handleAddFilter}>+ Ajouter un filtre</button>

        <div className="drawer-buttons">
          <button onClick={onClose}>Appliquer les filtres</button>
          <button className="cancel-btn" onClick={handleClear}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}
