import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { auth } from '../utils/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiLock, FiSave, FiLoader, FiShield,
  FiCamera, FiMapPin, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX
} from 'react-icons/fi';

const EMPTY_ADDRESS = {
  label: 'Home', fullName: '', phone: '', line1: '', line2: '',
  city: '', state: '', postalCode: '', country: '', isDefault: false,
};

// Country list — full global list
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize',
  'Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei',
  'Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Chile','China',
  'Colombia','Congo','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark',
  'Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji',
  'Finland','France','Georgia','Germany','Ghana','Greece','Guatemala','Haiti','Honduras',
  'Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy',
  'Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Libya','Lithuania','Luxembourg','Madagascar','Malaysia','Maldives','Mali',
  'Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Nepal','Netherlands','New Zealand','Nicaragua','Nigeria','North Korea','Norway','Oman',
  'Pakistan','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
  'Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal',
  'Serbia','Sierra Leone','Singapore','Slovakia','Slovenia','Somalia','South Africa',
  'South Korea','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
].sort();

export default function Profile() {
  const { user, profile, setProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef();

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarPreview(profile.avatar || null);
    }
    if (user) fetchAddresses();
  }, [profile]);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/api/auth/addresses');
      setAddresses(data);
    } catch {}
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarLoading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/api/auth/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile({ ...profile, avatar: data.avatar });
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(profile?.avatar || null);
    } finally {
      setAvatarLoading(false);
    }
  };

  const updateName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/auth/profile', { name });
      setProfile({ ...profile, name });
      toast.success('Name updated!');
    } catch { toast.error('Failed to update name'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      if (err.code === 'auth/wrong-password') toast.error('Current password is incorrect');
      else toast.error('Failed to change password');
    } finally { setChangingPw(false); }
  };

  const openAddressForm = (address = null) => {
    setEditingAddress(address);
    setAddressForm(address ? { ...address } : EMPTY_ADDRESS);
    setShowAddressForm(true);
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      let data;
      if (editingAddress) {
        const res = await api.put(`/api/auth/addresses/${editingAddress._id}`, addressForm);
        data = res.data;
        toast.success('Address updated!');
      } else {
        const res = await api.post('/api/auth/addresses', addressForm);
        data = res.data;
        toast.success('Address added!');
      }
      setAddresses(data);
      setShowAddressForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save address');
    } finally { setSavingAddress(false); }
  };

  const deleteAddress = async (addressId) => {
    if (!confirm('Delete this address?')) return;
    try {
      const { data } = await api.delete(`/api/auth/addresses/${addressId}`);
      setAddresses(data);
      toast.success('Address deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const setDefault = async (addressId) => {
    try {
      const { data } = await api.put(`/api/auth/addresses/${addressId}/set-default`);
      setAddresses(data);
      toast.success('Default address updated');
    } catch { toast.error('Failed to update'); }
  };

  if (authLoading) return null;

  return (
    <Layout title="Profile">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-white mb-8">Profile</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-800 p-1 rounded-xl mb-8 w-fit">
          {['profile', 'addresses', 'security'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card p-6">
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-700 flex items-center justify-center">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-white text-3xl font-bold">{profile?.name?.[0]?.toUpperCase()}</span>
                  }
                </div>
                <button onClick={() => fileInputRef.current.click()} disabled={avatarLoading}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 hover:bg-brand-500 rounded-full flex items-center justify-center transition-colors shadow-lg">
                  {avatarLoading ? <FiLoader className="text-white text-xs animate-spin" /> : <FiCamera className="text-white text-xs" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold">{profile?.name}</h2>
                <p className="text-white/40 text-sm">{profile?.email}</p>
                <span className={`text-xs mt-1 inline-flex items-center gap-1 ${
                  profile?.role === 'admin' ? 'text-brand-400' :
                  profile?.role === 'seller' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {profile?.role === 'admin' && <FiShield size={11} />}
                  {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
                </span>
              </div>
            </div>
            <form onSubmit={updateName} className="space-y-4">
              <div>
                <label className="label">Display Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={name} onChange={e => setName(e.target.value)} className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={profile?.email || ''} className="input pl-10 opacity-50 cursor-not-allowed" disabled />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 text-sm">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
              <button onClick={() => openAddressForm()} className="btn-primary flex items-center gap-2 text-sm py-2">
                <FiPlus size={14} /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="card p-10 text-center">
                <FiMapPin className="text-white/10 text-4xl mx-auto mb-3" />
                <p className="text-white/40">No saved addresses yet.</p>
                <button onClick={() => openAddressForm()} className="btn-primary mt-4 text-sm">Add your first address</button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr._id} className={`card p-5 ${addr.isDefault ? 'border-brand-600/50' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-brand-900/50 text-brand-400 border border-brand-700/50 px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-white/70 text-sm">{addr.fullName}</p>
                        <p className="text-white/50 text-sm">{addr.phone}</p>
                        <p className="text-white/50 text-sm mt-1">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}<br />
                          {addr.country}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!addr.isDefault && (
                          <button onClick={() => setDefault(addr._id)}
                            className="text-xs text-white/40 hover:text-brand-400 transition-colors flex items-center gap-1">
                            <FiCheck size={11} /> Set default
                          </button>
                        )}
                        <button onClick={() => openAddressForm(addr)}
                          className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1">
                          <FiEdit2 size={11} /> Edit
                        </button>
                        <button onClick={() => deleteAddress(addr._id)}
                          className="text-xs text-white/40 hover:text-red-400 transition-colors flex items-center gap-1">
                          <FiTrash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Address Form Modal */}
            {showAddressForm && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setShowAddressForm(false)}>
                <div className="card p-8 w-full max-w-lg my-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold text-white">
                      {editingAddress ? 'Edit Address' : 'Add Address'}
                    </h2>
                    <button onClick={() => setShowAddressForm(false)} className="text-white/40 hover:text-white"><FiX /></button>
                  </div>
                  <form onSubmit={saveAddress} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Label</label>
                        <input value={addressForm.label}
                          onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                          className="input" placeholder="Home, Work…" />
                      </div>
                      <div>
                        <label className="label">Full Name *</label>
                        <input value={addressForm.fullName}
                          onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          className="input" required />
                      </div>
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input value={addressForm.phone}
                        onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="input" placeholder="+1 555 000 0000" required />
                    </div>
                    <div>
                      <label className="label">Address Line 1 *</label>
                      <input value={addressForm.line1}
                        onChange={e => setAddressForm({ ...addressForm, line1: e.target.value })}
                        className="input" placeholder="Street address, P.O. box" required />
                    </div>
                    <div>
                      <label className="label">Address Line 2</label>
                      <input value={addressForm.line2}
                        onChange={e => setAddressForm({ ...addressForm, line2: e.target.value })}
                        className="input" placeholder="Apt, suite, floor (optional)" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">City *</label>
                        <input value={addressForm.city}
                          onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="input" required />
                      </div>
                      <div>
                        <label className="label">State / Province</label>
                        <input value={addressForm.state}
                          onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="input" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Postal Code *</label>
                        <input value={addressForm.postalCode}
                          onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          className="input" required />
                      </div>
                      <div>
                        <label className="label">Country *</label>
                        <select value={addressForm.country}
                          onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                          className="input" required>
                          <option value="">Select country…</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isDefault" checked={addressForm.isDefault}
                        onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="w-4 h-4 accent-brand-500" />
                      <label htmlFor="isDefault" className="text-white/60 text-sm cursor-pointer">Set as default address</label>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary flex-1">Cancel</button>
                      <button type="submit" disabled={savingAddress} className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {savingAddress && <FiLoader className="animate-spin" />}
                        {savingAddress ? 'Saving…' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && user?.providerData?.[0]?.providerId === 'password' && (
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
              <FiLock className="text-brand-400" /> Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input type="password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="input" required />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input" placeholder="Min 6 characters" required />
              </div>
              <button type="submit" disabled={changingPw} className="btn-secondary flex items-center gap-2">
                {changingPw ? <FiLoader className="animate-spin" /> : <FiLock />}
                {changingPw ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}