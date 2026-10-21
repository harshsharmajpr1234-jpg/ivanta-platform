'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, MapPin, Navigation, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface ResolvedAddress {
  addressLine1?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

interface MapAddressPickerProps {
  initialPincode?: string;
  initialCity?: string;
  initialState?: string;
  onSelectAddress: (addr: ResolvedAddress) => void;
  onClose?: () => void;
}

export function MapAddressPicker({
  initialPincode,
  initialCity,
  initialState,
  onSelectAddress,
  onClose,
}: MapAddressPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<ResolvedAddress | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import('leaflet');

      // Fix default marker icon asset issue in Next.js/Webpack
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div style="
          background: #0b5cff;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(11,92,255,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        "><div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Default to Jaipur or India Center
      const defaultLat = 26.9124;
      const defaultLng = 75.7873;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Invalidate size after layout completes
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      // Handle map clicks
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        void reverseGeocode(lat, lng);
      });

      // Handle marker drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        void reverseGeocode(pos.lat, pos.lng);
      });

      // Initial reverse geocode if pincode/city provided
      if (initialPincode && isMounted) {
        void searchPlace(`${initialPincode}, India`, true);
      } else {
        void reverseGeocode(defaultLat, defaultLng);
      }
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Reverse geocode lat,lng using OpenStreetMap
  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await res.json();
      const addr = data.address || {};

      const pin = addr.postcode?.replace(/\D/g, '').slice(0, 6) || '';
      const state = addr.state || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const district = addr.state_district || addr.county || city;
      const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
      const line1 = [addr.house_number, addr.road, addr.suburb].filter(Boolean).join(', ') || data.name || '';

      const resolved: ResolvedAddress = {
        addressLine1: line1,
        locality: locality || city,
        city: city || district,
        district: district || city,
        state,
        pincode: pin,
        lat,
        lng,
      };

      setCurrentAddress(resolved);
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Search places across India
  const searchPlace = async (query: string, autoSelect = false) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`
      );
      const items = await res.json();
      setSearchResults(items || []);

      if (autoSelect && items && items.length > 0) {
        selectSearchResult(items[0]);
      }
    } catch (e) {
      console.warn('Place search error:', e);
    } finally {
      setSearching(false);
    }
  };

  // Select a search result
  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }

    setSearchResults([]);
    setSearchQuery(item.display_name.split(',').slice(0, 3).join(','));
    void reverseGeocode(lat, lng);
  };

  // GPS auto-locate
  const detectGps = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
        }
        void reverseGeocode(lat, lng);
        setLocatingGps(false);
      },
      () => {
        setLocatingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    if (currentAddress) {
      onSelectAddress(currentAddress);
    }
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      {/* Top Controls */}
      <div className="border-b border-line bg-surface-sunk/40 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-[14px] font-bold text-ink">Interactive Delivery Map</h3>
              <p className="text-[11.5px] text-ink-muted">Tap on map or drag pin to your exact building / street</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={detectGps}
              disabled={locatingGps}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              <Navigation className={cn('h-3.5 w-3.5', locatingGps && 'animate-spin')} />
              {locatingGps ? 'Locating…' : 'GPS Detect'}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-surface-sunk hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Place Search Bar */}
        <div className="relative mt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  void searchPlace(e.target.value);
                } else {
                  setSearchResults([]);
                }
              }}
              placeholder="Search area, landmark or colony (e.g. Murlipura Jaipur, Connaught Place)..."
              className="h-9 w-full rounded-xl border border-line bg-white pl-9 pr-8 text-[12.5px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-ink-faint" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-line bg-white shadow-pop">
              {searchResults.map((item) => (
                <li key={item.place_id}>
                  <button
                    type="button"
                    onClick={() => selectSearchResult(item)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-surface-sunk"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="truncate text-ink">{item.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative h-[280px] w-full bg-surface-sunk sm:h-[340px]">
        <div ref={mapContainerRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-xs">
            <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-ink shadow-md">
              <Loader2 className="h-4 w-4 animate-spin text-accent" /> Resolving location…
            </span>
          </div>
        )}
      </div>

      {/* Bottom Address Confirmation Bar */}
      <div className="border-t border-line bg-white p-3 sm:p-4">
        {currentAddress ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-accent">Selected Delivery Point</span>
              <p className="truncate text-[13px] font-semibold text-ink">
                {currentAddress.locality || currentAddress.city || 'Location Pin'}
                {currentAddress.district ? `, ${currentAddress.district}` : ''}
                {currentAddress.state ? `, ${currentAddress.state}` : ''}
                {currentAddress.pincode ? ` — ${currentAddress.pincode}` : ''}
              </p>
              {currentAddress.addressLine1 && (
                <p className="truncate text-[11.5px] text-ink-muted">{currentAddress.addressLine1}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white shadow-soft transition-transform hover:scale-[1.02] active:scale-[.98]"
            >
              <Check className="h-4 w-4" /> Confirm Location
            </button>
          </div>
        ) : (
          <p className="text-center text-[12.5px] text-ink-muted">Tap anywhere on the map to set your address</p>
        )}
      </div>
    </div>
  );
}
