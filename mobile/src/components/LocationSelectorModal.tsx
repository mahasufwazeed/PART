import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  geoapifyService,
  locationService,
  SavedAddress,
  GeocodeSuggestion,
  CHENNAI_LOCALITIES,
} from '@part/shared';
import { MapLibreView } from './MapLibreView';
import {
  MapPin,
  Search,
  Crosshair,
  Home,
  Briefcase,
  Bookmark,
  Check,
  ChevronRight,
  AlertCircle,
  Plus,
  Compass,
  X,
  Navigation2,
} from 'lucide-react';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userLocation, setUserLocation, currentProfile, language } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Pin picker state
  const [pickerCoords, setPickerCoords] = useState<{ lat: number; lng: number }>({
    lat: userLocation.latitude || 12.9815,
    lng: userLocation.longitude || 80.218,
  });
  const [pickerAddress, setPickerAddress] = useState<string>('Loading address...');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<'Home' | 'Work' | 'Other'>('Home');

  const debounceTimeoutRef = useRef<any>(null);

  // Load Saved Addresses
  useEffect(() => {
    if (!isOpen) return;
    const loadSaved = async () => {
      const addrs = await locationService.getSavedAddresses(
        currentProfile?.id || 'guest_user'
      );
      setSavedAddresses(addrs);
    };
    loadSaved();
  }, [isOpen, currentProfile?.id]);

  // Debounced Geoapify Autocomplete (300ms)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsSearching(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await geoapifyService.autocomplete(searchQuery, {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        });
        setSuggestions(results);
      } catch (err) {
        console.warn('Autocomplete lookup error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, userLocation.latitude, userLocation.longitude]);

  // Reverse geocode when pin picker coordinates move
  useEffect(() => {
    if (!isMapPickerOpen) return;
    let isCancelled = false;

    const timer = setTimeout(async () => {
      const res = await geoapifyService.reverseGeocode(
        pickerCoords.lat,
        pickerCoords.lng
      );
      if (!isCancelled) {
        setPickerAddress(res.formatted);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [pickerCoords, isMapPickerOpen]);

  if (!isOpen) return null;

  // Real GPS Geolocation Trigger
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMessage('GPS Geolocation is not supported by this browser.');
      return;
    }

    setIsDetectingGps(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const rev = await geoapifyService.reverseGeocode(latitude, longitude);
          setUserLocation({
            locality: rev.formatted,
            latitude,
            longitude,
          });
          setIsDetectingGps(false);
          onClose();
        } catch {
          setUserLocation({
            locality: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Chennai`,
            latitude,
            longitude,
          });
          setIsDetectingGps(false);
          onClose();
        }
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage('Location permission denied. Please search or pick on map.');
        } else {
          setErrorMessage('Unable to determine GPS location. Please try searching.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    setUserLocation({
      locality: s.formatted,
      latitude: s.lat,
      longitude: s.lon,
    });
    onClose();
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setUserLocation({
      locality: addr.locality || addr.address_line,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    onClose();
  };

  const handleConfirmPickerLocation = async () => {
    setUserLocation({
      locality: pickerAddress,
      latitude: pickerCoords.lat,
      longitude: pickerCoords.lng,
    });

    // Save address if user toggled
    if (isSavingAddress && currentProfile?.id) {
      await locationService.saveAddress(currentProfile.id, {
        label: selectedLabel,
        title: `${selectedLabel} Address`,
        address_line: pickerAddress,
        locality: pickerAddress.split(',')[0] || 'Chennai',
        latitude: pickerCoords.lat,
        longitude: pickerCoords.lng,
      });
    }

    setIsMapPickerOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-black text-lg text-neutral-900 tracking-tight">
              {language === 'ta' ? 'இருப்பிடத்தை தேர்வு செய்க' : 'Select Location'}
            </h3>
            <p className="text-xs text-neutral-500">
              {language === 'ta'
                ? 'உங்கள் அருகில் உள்ள பணிகளை விரைவாக கண்டறியுங்கள்'
                : 'Discover tasks and helpers around your neighborhood'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Blinkit-Style Rounded Location Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for area, apartment, street or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-3 bg-neutral-100 border border-neutral-200/80 rounded-2xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-9 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-part-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-card divide-y divide-neutral-100">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full p-3 text-left hover:bg-neutral-50 flex items-start gap-3 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-xl bg-part-green/10 text-part-green flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-bold text-neutral-900 truncate">
                      {s.address_line1 || s.formatted.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-neutral-500 truncate">
                      {s.formatted}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Action Row: Use Current Location & Set on Map */}
          {!isMapPickerOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary GPS Location Button */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="w-full p-3 rounded-2xl border border-part-green/40 bg-emerald-50/70 hover:bg-emerald-50 text-neutral-900 flex items-center gap-3 transition shadow-xs cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Crosshair
                    className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`}
                  />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-heading font-black text-xs text-part-green block">
                    {isDetectingGps ? 'Detecting GPS...' : 'Use Current Location'}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate block">
                    Using Device GPS
                  </span>
                </div>
              </button>

              {/* Set Pin on Map Button */}
              <button
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="w-full p-3 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 flex items-center gap-3 transition shadow-xs cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-brand-yellow text-neutral-900 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Navigation2 className="w-4 h-4 fill-neutral-900" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-heading font-bold text-xs text-neutral-900 block">
                    Set on Map
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate block">
                    Drag pin to exact spot
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Interactive Map Pin Picker Mode */}
          {isMapPickerOpen && (
            <div className="space-y-3 bg-neutral-50 p-3.5 rounded-3xl border border-neutral-200 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-heading font-black text-neutral-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-part-green" />
                  <span>Drag map to place pin</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-800 font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Mini MapLibre GL Pin Picker */}
              <div className="h-[220px] rounded-2xl overflow-hidden shadow-inner border border-neutral-200">
                <MapLibreView
                  centerLat={pickerCoords.lat}
                  centerLng={pickerCoords.lng}
                  zoom={15}
                  isPickerMode={true}
                  onPickerLocationChange={(lat, lng) =>
                    setPickerCoords({ lat, lng })
                  }
                  className="h-full"
                />
              </div>

              {/* Reverse Geocoded Pin Address Preview */}
              <div className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-xs">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Selected Landmark
                </span>
                <p className="text-xs font-semibold text-neutral-800 line-clamp-2 mt-0.5">
                  {pickerAddress}
                </p>
              </div>

              {/* Save Address Toggle for Current User */}
              {currentProfile && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={isSavingAddress}
                      onChange={(e) => setIsSavingAddress(e.target.checked)}
                      className="rounded border-neutral-300 text-part-green focus:ring-part-green"
                    />
                    <span>Save this address for fast checkout</span>
                  </label>

                  {isSavingAddress && (
                    <div className="flex items-center gap-2 mt-2">
                      {(['Home', 'Work', 'Other'] as const).map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setSelectedLabel(label)}
                          className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition ${
                            selectedLabel === label
                              ? 'bg-part-green text-white shadow-xs'
                              : 'bg-white border border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Pin Location Button */}
              <button
                type="button"
                onClick={handleConfirmPickerLocation}
                className="w-full py-3 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green transition cursor-pointer"
              >
                Confirm Location
              </button>
            </div>
          )}

          {/* Saved Addresses Section */}
          {!isMapPickerOpen && savedAddresses.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                Saved Addresses
              </span>

              <div className="space-y-2">
                {savedAddresses.map((addr) => {
                  const isSelected =
                    userLocation.locality.includes(addr.locality) ||
                    userLocation.locality === addr.address_line;

                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                        isSelected
                          ? 'border-part-green bg-emerald-50/50'
                          : 'border-neutral-200/80 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            addr.label === 'Home'
                              ? 'bg-amber-100 text-amber-800'
                              : addr.label === 'Work'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-part-green'
                          }`}
                        >
                          {addr.label === 'Home' ? (
                            <Home className="w-4 h-4" />
                          ) : addr.label === 'Work' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className="font-heading font-bold text-xs text-neutral-900 block truncate">
                            {addr.title || addr.label}
                          </span>
                          <span className="text-[11px] text-neutral-500 block truncate">
                            {addr.address_line}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-part-green text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Chennai Neighborhood Quick Chips */}
          {!isMapPickerOpen && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                Popular Chennai Localities
              </span>

              <div className="flex flex-wrap gap-1.5">
                {CHENNAI_LOCALITIES.slice(0, 10).map((loc) => {
                  const isCurrent = userLocation.locality.includes(loc.name);
                  return (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        setUserLocation({
                          locality: `${loc.name}, Chennai`,
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                        });
                        onClose();
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                        isCurrent
                          ? 'bg-part-green text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
