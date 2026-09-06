import React, { useState } from 'react';
import { MapPin, Search, Navigation, Check, X } from 'lucide-react';
import { type LocationData } from '../types';

interface LocationPickerProps {
  location?: LocationData;
  onSelectLocation: (loc: LocationData | undefined) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onSelectLocation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setGeoError(null);

    try {
      const res = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!res.ok) throw new Error('Failed to resolve address');
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err: any) {
      setGeoError(err.message || 'Geocoding request failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setIsSearching(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));

        const loc: LocationData = {
          latitude: lat,
          longitude: lng,
          name: 'Current Coordinates',
          address: `Lat: ${lat}, Lng: ${lng}`,
          placeId: `geo_${Date.now()}`,
        };

        onSelectLocation(loc);
        setIsSearching(false);
        setIsOpen(false);
      },
      (err) => {
        setIsSearching(false);
        setGeoError(err.message || 'Unable to retrieve your current location');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative inline-block text-xs">
      {location ? (
        <div
          id="pinned-location-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-emerald-900/60 text-emerald-400 rounded-full font-mono text-[11px]"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[140px]" title={location.address || location.name}>
            {location.name || location.address}
          </span>
          <button
            type="button"
            onClick={() => onSelectLocation(undefined)}
            className="hover:text-red-400 p-0.5 rounded transition-colors"
            title="Remove location"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-full transition-colors"
          title="Pin Google Maps location"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Pin Location</span>
        </button>
      )}

      {isOpen && (
        <div
          id="location-picker-modal"
          className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 p-3 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2.5">
            <div className="flex items-center gap-1.5 font-medium text-neutral-200 text-xs">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Location-Aware Journaling</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-1.5 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, venue or place..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-2 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-2" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
            >
              {isSearching ? '...' : 'Find'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 hover:text-white transition-colors mb-2 text-xs"
          >
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>Use My Current Coordinates</span>
          </button>

          {geoError && (
            <p className="text-[11px] text-amber-400 bg-amber-950/30 p-1.5 rounded border border-amber-900/50 mb-2">
              {geoError}
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-36 overflow-y-auto border-t border-neutral-800 pt-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block px-1">
                Suggested Locations
              </span>
              {searchResults.map((res, idx) => (
                <button
                  key={res.placeId || idx}
                  type="button"
                  onClick={() => {
                    onSelectLocation(res);
                    setIsOpen(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full text-left p-1.5 rounded-lg hover:bg-neutral-800 flex items-start justify-between gap-2 transition-colors"
                >
                  <div className="truncate">
                    <div className="text-xs text-neutral-200 truncate">{res.name}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{res.address}</div>
                  </div>
                  <Check className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
