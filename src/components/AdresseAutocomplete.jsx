import React, { useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

export default function AdresseAutocomplete({ onPlaceSelected }) {
  const inputRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (!isLoaded || !window.google || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      componentRestrictions: { country: 'fr' },
    });

    autocomplete.setFields(['address_components', 'formatted_address']);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (onPlaceSelected) onPlaceSelected(place);
    });
  }, [isLoaded, onPlaceSelected]);

  return (
    <div className="autocomplete-wrapper">
      <input
        ref={inputRef}
        type="text"
        placeholder="Commencez à taper l'adresse..."
        className="adresse-autocomplete pac-target-input"
        autoComplete="off"
      />
    </div>
  );
}
