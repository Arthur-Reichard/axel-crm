import React, { useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

export default function AdresseAutocomplete({ onPlaceSelected }) {
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !window.google || !inputRef.current) return;

    document.querySelectorAll('.pac-container').forEach(el => el.remove());
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'fr' },
    });

    autocomplete.setFields(['address_components', 'formatted_address']);

    // 🔥 Repositionner le conteneur Google dans le wrapper local
    setTimeout(() => {
      const pacContainer = document.querySelector('.pac-container');
      if (pacContainer && suggestionsRef.current) {
        suggestionsRef.current.appendChild(pacContainer);
        pacContainer.style.position = 'absolute';
        pacContainer.style.top = '100%';
        pacContainer.style.left = '0';
        pacContainer.style.width = '100%';
        pacContainer.style.zIndex = '300';
      }
    }, 300);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (onPlaceSelected) onPlaceSelected(place);
    });
  }, [isLoaded, onPlaceSelected]);

  return (
    <div className="autocomplete-wrapper">
      <div className="lead-field">
        <input
          ref={inputRef}
          type="text"
          placeholder="Commencez à taper l'adresse..."
          className="adresse-autocomplete pac-target-input"
          autoComplete="off"
        />
      </div>
      <div ref={suggestionsRef} />
    </div>
  );
}