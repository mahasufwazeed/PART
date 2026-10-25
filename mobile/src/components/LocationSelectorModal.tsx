import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  geoapifyService,
  locationService,
  SavedAddress,
  GeocodeSuggestion,
  CHENNAI_LOCALITIES,
  LocationSource,
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
  GraduationCap,
  Building2,
  Trash2,
  Edit3,
  RefreshCw,
} from 'lucide-react';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (loc: {
    locality: string;
    latitude: number;
    longitude: number;
    source?: LocationSource;
  }) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const {
    activeLocation,
    setActiveLocation,
    currentProfile,
    language,
    isLocatingGPS,
    setIsLocatingGPS,
    gpsError,
    setGpsError,
    setLocationPermissionStatus,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  // Address edit / add modal state
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [formLabel, setFormLabel] = useState<string>('Home');
  const [formTitle, setFormTitle] = useState('');
  const [formAddressLine, setFormAddressLine] = useState('');
  const [formLocality, setFormLocality] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Pin picker state
  const [pickerCoords, setPickerCoords] = useState<{ lat: number; lng: number }>({
    lat: activeLocation.coordinates.latitude || 12.9815,
    lng: activeLocation.coordinates.longitude || 80.218,
  });
  const [pickerAddress, setPickerAddress] = useState<string>('Loading address...');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [selectedPinLabel, setSelectedPinLabel] = useState<'Home' | 'Office' | 'College' | 'University' | 'Other'>('Home');

  const debounceTimeoutRef = useRef<any>(null);

  // Load Saved Addresses
  const loadSavedAddresses = async () => {
    const addrs = await locationService.getSavedAddresses(
      currentProfile?.id || 'guest_user'
    );
    setSavedAddresses(addrs);
  };

  useEffect(() => {
    if (!isOpen) return;
    loadSavedAddresses();
    setPermissionDenied(false);
  }, [isOpen, currentProfile?.id]);

  // Debounced Geoapify Autocomplete (250ms)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
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
          lat: activeLocation.coordinates.latitude,
          lng: activeLocation.coordinates.longitude,
        });
        setSuggestions(results);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Autocomplete lookup error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, activeLocation.coordinates.latitude, activeLocation.coordinates.longitude]);

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

  // Real GPS Geolocation Trigger with permission handling & accuracy display
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsError(null);
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setLocationPermissionStatus('granted');

        try {
          const rev = await geoapifyService.reverseGeocode(latitude, longitude);
          const label = rev.formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Chennai`;
          setActiveLocation({
            coordinates: { latitude, longitude },
            label,
            source: 'gps',
            accuracyMeters: Math.round(accuracy),
          });
          onSelectLocation?.({ locality: label, latitude, longitude, source: 'gps' });
        } catch {
          const label = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setActiveLocation({
            coordinates: { latitude, longitude },
            label,
            source: 'gps',
            accuracyMeters: Math.round(accuracy),
          });
          onSelectLocation?.({ locality: label, latitude, longitude, source: 'gps' });
        } finally {
          setIsLocatingGPS(false);
          onClose();
        }
      },
      (err) => {
        setIsLocatingGPS(false);
        if (err.code === 1) {
          // Permission Denied
          setLocationPermissionStatus('denied');
          setPermissionDenied(true);
          setGpsError(
            'Location permission was denied. Please allow location access in your browser settings, or select your Chennai area below.'
          );
        } else if (err.code === 3) {
          // Timeout
          setGpsError('GPS acquisition timed out. Please try again or select your location manually.');
        } else {
          // Position unavailable
          setGpsError('Could not acquire your exact GPS coordinates. Please select your locality below.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    setActiveLocation({
      coordinates: { latitude: s.lat, longitude: s.lon },
      label: s.formatted,
      source: 'search',
    });
    onSelectLocation?.({ locality: s.formatted, latitude: s.lat, longitude: s.lon, source: 'search' });
    onClose();
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    const locality = addr.locality || addr.formattedAddress || addr.address_line;
    setActiveLocation({
      coordinates: { latitude: addr.latitude, longitude: addr.longitude },
      label: locality,
      source: 'saved_address',
    });
    onSelectLocation?.({
      locality,
      latitude: addr.latitude,
      longitude: addr.longitude,
      source: 'saved_address',
    });
    onClose();
  };

  const handleConfirmPickerLocation = async () => {
    setActiveLocation({
      coordinates: { latitude: pickerCoords.lat, longitude: pickerCoords.lng },
      label: pickerAddress,
      source: 'map_pin',
    });
    onSelectLocation?.({
      locality: pickerAddress,
      latitude: pickerCoords.lat,
      longitude: pickerCoords.lng,
      source: 'map_pin',
    });

    if (isSavingAddress && currentProfile?.id) {
      await locationService.saveAddress(currentProfile.id, {
        label: selectedPinLabel,
        title: `${selectedPinLabel} Address`,
        address_line: pickerAddress,
        formattedAddress: pickerAddress,
        locality: pickerAddress.split(',')[0] || 'Chennai',
        latitude: pickerCoords.lat,
        longitude: pickerCoords.lng,
      });
      await loadSavedAddresses();
    }

    setIsMapPickerOpen(false);
    onClose();
  };

  const handleSaveAddressForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddressLine.trim()) return;

    const resolvedLocality = formLocality.trim() || formAddressLine.split(',')[0].trim() || 'Chennai';
    let lat = activeLocation.coordinates.latitude;
    let lng = activeLocation.coordinates.longitude;

    const matched = CHENNAI_LOCALITIES.find((l) =>
      resolvedLocality.toLowerCase().includes(l.name.toLowerCase())
    );
    if (matched) {
      lat = matched.latitude;
      lng = matched.longitude;
    }

    if (editingAddress) {
      await locationService.updateSavedAddress(
        currentProfile?.id || 'guest_user',
        editingAddress.id,
        {
          label: formLabel as any,
          title: formTitle.trim() || `${formLabel} Address`,
          address_line: formAddressLine.trim(),
          formattedAddress: formAddressLine.trim(),
          locality: resolvedLocality,
          latitude: lat,
          longitude: lng,
          isDefault: formIsDefault,
        }
      );
    } else {
      await locationService.saveAddress(
        currentProfile?.id || 'guest_user',
        {
          label: formLabel as any,
          title: formTitle.trim() || `${formLabel} Address`,
          address_line: formAddressLine.trim(),
          formattedAddress: formAddressLine.trim(),
          locality: resolvedLocality,
          latitude: lat,
          longitude: lng,
          isDefault: formIsDefault,
        }
      );
    }

    await loadSavedAddresses();
    setIsAddingAddress(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await locationService.deleteSavedAddress(currentProfile?.id || 'guest_user', id);
    await loadSavedAddresses();
  };

  const handleSetDefaultAddress = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await locationService.setDefaultAddress(currentProfile?.id || 'guest_user', id);
    await loadSavedAddresses();
  };

  const getAddressIcon = (label: string) => {
    switch (label) {
      case 'Home':
        return <Home className="w-4 h-4" />;
      case 'Office':
      case 'Work':
        return <Briefcase className="w-4 h-4" />;
      case 'College':
      case 'University':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Bookmark className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] flex flex-col">
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
          {/* Active Location Indicator Banner */}
          <div className="bg-emerald-50/70 border border-part-green/30 px-3.5 py-2.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-part-green text-white flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-part-green block">
                  Active Search Area ({activeLocation.source.toUpperCase()})
                </span>
                <span className="text-xs font-heading font-bold text-neutral-900 block truncate">
                  {activeLocation.label}
                </span>
              </div>
            </div>
            {activeLocation.accuracyMeters && (
              <span className="text-[10px] font-bold text-part-green bg-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                ±{activeLocation.accuracyMeters}m
              </span>
            )}
          </div>

          {/* GPS Error & Permission Denied Notice with Retry */}
          {gpsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{gpsError}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-heading font-bold text-[11px] rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry GPS Detection</span>
                </button>
              </div>
            </div>
          )}

          {/* Location Search Bar with Autocomplete & Keyboard Navigation */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search area, apartment, street, landmark, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
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
              {suggestions.map((s, idx) => (
                <button
                  key={s.place_id || idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className={`w-full p-3 text-left flex items-start gap-3 transition cursor-pointer ${
                    selectedIndex === idx ? 'bg-emerald-50/80' : 'hover:bg-neutral-50'
                  }`}
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
          {!isMapPickerOpen && !isAddingAddress && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Primary GPS Location Button */}
              <button
                id="btn-use-current-location"
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocatingGPS}
                className="w-full p-3 rounded-2xl border border-part-green/40 bg-emerald-50/70 hover:bg-emerald-50 text-neutral-900 flex items-center gap-3 transition shadow-xs cursor-pointer group active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Crosshair
                    className={`w-4 h-4 ${isLocatingGPS ? 'animate-spin' : ''}`}
                  />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-heading font-black text-xs text-part-green block">
                    {isLocatingGPS ? 'Acquiring GPS...' : 'Use Current Location'}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate block">
                    {isLocatingGPS ? 'Reading high accuracy device GPS' : 'Device GPS with accuracy check'}
                  </span>
                </div>
              </button>

              {/* Set Pin on Map Button */}
              <button
                id="btn-set-on-map"
                type="button"
                onClick={() => setIsMapPickerOpen(true)}
                className="w-full p-3 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 flex items-center gap-3 transition shadow-xs cursor-pointer group active:scale-[0.98]"
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
                  onPickerLocationChange={(lat, lng) => setPickerCoords({ lat, lng })}
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

              {/* Save Address Toggle for User */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={isSavingAddress}
                    onChange={(e) => setIsSavingAddress(e.target.checked)}
                    className="rounded border-neutral-300 text-part-green focus:ring-part-green"
                  />
                  <span>Save this address to your account</span>
                </label>

                {isSavingAddress && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(['Home', 'Office', 'College', 'University', 'Other'] as const).map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setSelectedPinLabel(label)}
                        className={`px-3 py-1 rounded-xl text-xs font-heading font-bold transition ${
                          selectedPinLabel === label
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

          {/* Add / Edit Saved Address Form */}
          {isAddingAddress && (
            <form
              onSubmit={handleSaveAddressForm}
              className="bg-neutral-50 p-4 rounded-3xl border border-neutral-200 space-y-3 animate-slide-up"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-black text-xs text-neutral-900">
                  {editingAddress ? 'Edit Saved Address' : 'Add New Saved Address'}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(false);
                    setEditingAddress(null);
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-800 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['Home', 'Office', 'College', 'University', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setFormLabel(lbl)}
                    className={`px-3 py-1 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition ${
                      formLabel === lbl
                        ? 'bg-part-green text-white shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Title (e.g. My Apartment, SRM Hostel, Tech Park)"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
              />

              <input
                type="text"
                placeholder="Address line (e.g. 14, 2nd Main Road, Vijaya Nagar)"
                value={formAddressLine}
                onChange={(e) => setFormAddressLine(e.target.value)}
                required
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
              />

              <input
                type="text"
                placeholder="Locality (e.g. Velachery, Anna Nagar, Pallavaram)"
                value={formLocality}
                onChange={(e) => setFormLocality(e.target.value)}
                className="w-full p-2.5 bg-white border border-neutral-200 rounded-xl text-xs"
              />

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="rounded text-part-green focus:ring-part-green"
                />
                <span>Set as default address</span>
              </label>

              <button
                type="submit"
                className="w-full py-2.5 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {editingAddress ? 'Update Address' : 'Save Address'}
              </button>
            </form>
          )}

          {/* Saved Addresses Section */}
          {!isMapPickerOpen && !isAddingAddress && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                  Saved Addresses
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setFormLabel('Home');
                    setFormTitle('');
                    setFormAddressLine('');
                    setFormLocality('');
                    setFormIsDefault(false);
                    setIsAddingAddress(true);
                  }}
                  className="text-xs font-heading font-bold text-part-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="space-y-2">
                {savedAddresses.map((addr) => {
                  const isSelected =
                    activeLocation.label.includes(addr.locality) ||
                    activeLocation.label === addr.address_line;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition cursor-pointer group ${
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
                              : addr.label === 'Office' || addr.label === 'Work'
                              ? 'bg-blue-100 text-blue-800'
                              : addr.label === 'College' || addr.label === 'University'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-part-green'
                          }`}
                        >
                          {getAddressIcon(addr.label)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-xs text-neutral-900 block truncate">
                              {addr.title || addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-neutral-900 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                DEFAULT
                              </span>
                            )}
                            {addr.isDemo && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                DEMO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500 block truncate">
                            {addr.formattedAddress || addr.address_line}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!addr.isDemo && (
                          <>
                            <button
                              type="button"
                              title="Edit address"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAddress(addr);
                                setFormLabel(addr.label);
                                setFormTitle(addr.title);
                                setFormAddressLine(addr.formattedAddress || addr.address_line);
                                setFormLocality(addr.locality);
                                setFormIsDefault(!!addr.isDefault);
                                setIsAddingAddress(true);
                              }}
                              className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete address"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-part-green text-white flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popular Chennai Neighborhood Quick Chips */}
          {!isMapPickerOpen && !isAddingAddress && (
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                Popular Chennai Localities
              </span>

              <div className="flex flex-wrap gap-1.5">
                {CHENNAI_LOCALITIES.map((loc) => {
                  const isCurrent = activeLocation.label.toLowerCase().includes(loc.name.toLowerCase());
                  return (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        const label = `${loc.name}, Chennai`;
                        setActiveLocation({
                          coordinates: { latitude: loc.latitude, longitude: loc.longitude },
                          label,
                          source: 'search',
                        });
                        onSelectLocation?.({
                          locality: label,
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                          source: 'search',
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
