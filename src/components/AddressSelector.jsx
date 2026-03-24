// components/AddressSelector.jsx
// Address search using SerpApi + saved address manager

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FiMapPin, FiPlus, FiTrash2, FiLoader, FiCheck, FiSearch, FiX } from 'react-icons/fi';

export default function AddressSelector({ selected, onSelect }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/auth/addresses');
      setSaved(data);
    } catch {}
    finally { setLoading(false); }
  };

  // Search addresses via SerpApi Google Maps
const searchAddress = async (q) => {
  if (!q || q.length < 3) { setResults([]); return; }
  setSearching(true);
  try {
    const { data } = await api.get(`/api/auth/address-search?q=${encodeURIComponent(q)}`);
    setResults(data);
  } catch (err) {
    console.error('Address search error:', err);
    setResults([]);
  } finally {
    setSearching(false);
  }
};

  const handleQueryChange = (val) => {
    setQuery(val);
    setSelectedResult(null);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchAddress(val), 600);
  };

  const selectResult = (result) => {
    const full = result.address || result.title;
    setSelectedResult({ ...result, fullAddress: full });
    setQuery(full);
    setResults([]);
  };

  const saveAddress = async () => {
  const addressToSave = selectedResult?.fullAddress || query.trim();
  
  if (!addressToSave) {
    alert('Please enter an address');
    return;
  }

  setSaving(true);
  try {
    const { data } = await api.post('/api/auth/addresses', {
      label: newLabel || 'Home',
      fullAddress: addressToSave,
      placeId: selectedResult?.placeId || '',
      lat: selectedResult?.lat || null,
      lng: selectedResult?.lng || null,
    });
    setSaved(data);
    setShowNew(false);
    setQuery('');
    setSelectedResult(null);
    setResults([]);
  } catch (err) {
    console.error('Save address error:', err.response?.data);
    alert(err.response?.data?.error || 'Failed to save address');
  } finally { 
    setSaving(false); 
  }
};

  const deleteAddress = async (id) => {
    try {
      const { data } = await api.delete(`/api/auth/addresses/${id}`);
      setSaved(data);
      if (selected?._id === id) onSelect(null);
    } catch {}
  };

  return (
    <div className="space-y-3">
      <label className="label">Delivery Address</label>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <FiLoader className="animate-spin" size={14} /> Loading addresses…
        </div>
      ) : (
        <div className="space-y-2">
          {/* Saved addresses */}
          {saved.map((addr) => (
            <div
              key={addr._id}
              onClick={() => onSelect(addr)}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                selected?._id === addr._id
                  ? 'border-brand-500 bg-brand-900/20'
                  : 'border-white/10 bg-dark-700 hover:border-white/20'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected?._id === addr._id ? 'border-brand-500 bg-brand-500' : 'border-white/30'
              }`}>
                {selected?._id === addr._id && <FiCheck size={10} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{addr.label}</p>
                <p className="text-white/40 text-xs truncate">{addr.fullAddress}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteAddress(addr._id); }}
                className="text-white/20 hover:text-red-400 transition-colors mt-0.5 flex-shrink-0"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add new address */}
          {!showNew ? (
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/10 hover:border-brand-500/50 text-white/40 hover:text-brand-400 text-sm transition-all"
            >
              <FiPlus size={14} /> Add new address
            </button>
          ) : (
            <div className="bg-dark-700 rounded-xl p-4 space-y-3 border border-white/10">
              {/* Label selector */}
              <div className="grid grid-cols-3 gap-2">
                {['Home', 'Work', 'Other'].map((l) => (
                  <button key={l} type="button" onClick={() => setNewLabel(l)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      newLabel === l
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-dark-600 border-white/10 text-white/50 hover:text-white'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search for an address…"
                  className="input pl-9 pr-8 text-sm"
                />
                {searching && (
                  <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" size={14} />
                )}
                {query && !searching && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setResults([]); setSelectedResult(null); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>

              {/* Search results dropdown */}
              {results.length > 0 && (
                <div className="bg-dark-600 rounded-lg border border-white/10 overflow-hidden">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectResult(r)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <FiMapPin className="text-brand-400 mt-0.5 flex-shrink-0" size={13} />
                      <div className="min-w-0">
                        {r.title && <p className="text-white text-xs font-medium truncate">{r.title}</p>}
                        <p className="text-white/50 text-xs truncate">{r.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {query.length >= 3 && !searching && results.length === 0 && !selectedResult && (
                <div className="text-center py-2">
                  <p className="text-white/30 text-xs">No results found. You can still save the address as typed.</p>
                </div>
              )}

              {/* Selected address confirmation */}
              {selectedResult && (
                <div className="flex items-center gap-2 bg-brand-900/20 border border-brand-700/40 rounded-lg px-3 py-2">
                  <FiCheck size={13} className="text-brand-400 flex-shrink-0" />
                  <p className="text-white/70 text-xs truncate">{selectedResult.fullAddress}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowNew(false); setQuery(''); setResults([]); setSelectedResult(null); }}
                  className="btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving || !query}
                  className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2"
                >
                  {saving && <FiLoader className="animate-spin" size={12} />}
                  Save Address
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}