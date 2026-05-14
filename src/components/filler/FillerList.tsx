import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fillerApi } from '../../api/fillerApi';
import { userApi } from '../../api/userApi';
import { Filler } from '../../types/api.types';
import { Card } from '../common/Card';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';
import { useConfirm } from '../common/ConfirmDialog';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapCenterSync: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center, map]);
  return null;
};

const emptyForm = {
  name: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Türkiye',
  latitude: '',
  longitude: '',
  contactPhone: '',
  contactEmail: '',
  contactPersonName: '',
  taxId: '',
};

export const FillerList: React.FC = () => {
  const confirm = useConfirm();
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 5;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ ...emptyForm });
  const [registerError, setRegisterError] = useState('');

  // register geocode state
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [geocodeError, setGeocodeError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  // Nominatim importance < 0.5 → adres geocode'unun düşük güvenli olduğuna işaret eder.
  const [geocodeConfidence, setGeocodeConfidence] = useState<'high' | 'low' | null>(null);
  const [geocodeMatchedDisplay, setGeocodeMatchedDisplay] = useState<string>('');

  // edit modal state
  const [editingFiller, setEditingFiller] = useState<Filler | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editError, setEditError] = useState('');
  const [editGeoStatus, setEditGeoStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [editGeoError, setEditGeoError] = useState('');
  const [editMapCenter, setEditMapCenter] = useState<[number, number] | null>(null);
  const [editGeoConfidence, setEditGeoConfidence] = useState<'high' | 'low' | null>(null);
  const [editGeoMatchedDisplay, setEditGeoMatchedDisplay] = useState<string>('');

  // customer user creation modal
  const [userForFiller, setUserForFiller] = useState<Filler | null>(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', fullName: '' });
  const [userError, setUserError] = useState('');
  const [userSaving, setUserSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setDebouncedSearch(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadFillers(page);
  }, [page, filter, debouncedSearch]);

  const loadFillers = async (p: number) => {
    try {
      setIsLoading(true);
      const activeFilter = filter === 'ALL' ? undefined : filter === 'ACTIVE';
      const data = await fillerApi.getAll({ active: activeFilter, page: p, size: PAGE_SIZE, search: debouncedSearch || undefined });
      setFillers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowRegisterModal(false);
    setRegisterForm({ ...emptyForm });
    setRegisterError('');
    setGeocodeStatus('idle');
    setGeocodeError('');
    setMapCenter(null);
  };

  const handleGeocode = async () => {
    const { street, city, province, postalCode, country } = registerForm;
    const query = [street, province, city, postalCode, country].filter(Boolean).join(', ');
    setGeocodeStatus('loading');
    setGeocodeError('');
    setGeocodeConfidence(null);
    setGeocodeMatchedDisplay('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'tr', 'User-Agent': 'CamSise-App/1.0' },
      });
      const data = await res.json();
      if (!data.length) {
        setGeocodeStatus('error');
        setGeocodeError('Adres bulunamadı. Adresi kontrol edip tekrar deneyin.');
        return;
      }
      const top = data[0];
      const lat = parseFloat(top.lat);
      const lon = parseFloat(top.lon);
      setRegisterForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lon) }));
      setMapCenter([lat, lon]);
      setGeocodeStatus('found');
      // Importance < 0.5 → düşük güvenli (Nominatim'in heuristik skoru, 0..1).
      // Type 'house' veya 'building' yoksa da düşük güven sayıyoruz.
      const importance: number = typeof top.importance === 'number' ? top.importance : 0;
      const goodType = top.type === 'house' || top.type === 'building' || top.osm_type === 'way';
      setGeocodeConfidence(importance >= 0.5 && goodType ? 'high' : 'low');
      setGeocodeMatchedDisplay(top.display_name ?? '');
    } catch {
      setGeocodeStatus('error');
      setGeocodeError('Konum servisi ile bağlantı kurulamadı.');
    }
  };

  const openEdit = (filler: Filler) => {
    setEditingFiller(filler);
    setEditForm({
      name: filler.name,
      street: filler.address.street,
      city: filler.address.city,
      province: filler.address.province,
      postalCode: filler.address.postalCode,
      country: filler.address.country,
      latitude: String(filler.location.latitude),
      longitude: String(filler.location.longitude),
      contactPhone: filler.contactInfo.phone,
      contactEmail: filler.contactInfo.email,
      contactPersonName: filler.contactInfo.contactPersonName,
      taxId: filler.taxId?.value ?? '',
    });
    setEditGeoStatus(filler.location.latitude ? 'found' : 'idle');
    setEditMapCenter(filler.location.latitude ? [filler.location.latitude, filler.location.longitude] : null);
    setEditError('');
    setEditGeoError('');
  };

  const closeEdit = () => {
    setEditingFiller(null);
    setEditForm({ ...emptyForm });
    setEditError('');
    setEditGeoStatus('idle');
    setEditGeoError('');
    setEditMapCenter(null);
  };

  const handleEditGeocode = async () => {
    const { street, city, province, postalCode, country } = editForm;
    const query = [street, province, city, postalCode, country].filter(Boolean).join(', ');
    setEditGeoStatus('loading');
    setEditGeoError('');
    setEditGeoConfidence(null);
    setEditGeoMatchedDisplay('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'tr', 'User-Agent': 'CamSise-App/1.0' } });
      const data = await res.json();
      if (!data.length) {
        setEditGeoStatus('error');
        setEditGeoError('Adres bulunamadı. Adresi kontrol edip tekrar deneyin.');
        return;
      }
      const top = data[0];
      const lat = parseFloat(top.lat);
      const lon = parseFloat(top.lon);
      setEditForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lon) }));
      setEditMapCenter([lat, lon]);
      setEditGeoStatus('found');
      const importance: number = typeof top.importance === 'number' ? top.importance : 0;
      const goodType = top.type === 'house' || top.type === 'building' || top.osm_type === 'way';
      setEditGeoConfidence(importance >= 0.5 && goodType ? 'high' : 'low');
      setEditGeoMatchedDisplay(top.display_name ?? '');
    } catch {
      setEditGeoStatus('error');
      setEditGeoError('Konum servisi ile bağlantı kurulamadı.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFiller) return;
    if (!editForm.latitude || !editForm.longitude) {
      setEditError('Konum bilgisi eksik. "Konumu Bul" butonuna basın.');
      return;
    }
    setEditError('');
    try {
      await fillerApi.update(editingFiller.id, {
        ...editForm,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
      });
      closeEdit();
      loadFillers(page);
    } catch (err) {
      setEditError(handleApiError(err));
    }
  };

  const openUserModal = (filler: Filler) => {
    setUserForFiller(filler);
    setUserForm({ username: '', password: '', fullName: '' });
    setUserError('');
  };

  const closeUserModal = () => {
    setUserForFiller(null);
    setUserForm({ username: '', password: '', fullName: '' });
    setUserError('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForFiller) return;
    setUserSaving(true);
    setUserError('');
    try {
      await userApi.createCustomer({
        username: userForm.username,
        password: userForm.password,
        fullName: userForm.fullName,
        fillerId: userForFiller.id,
      });
      closeUserModal();
    } catch (err: any) {
      setUserError(err?.response?.data?.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setUserSaving(false);
    }
  };

  const handleActivate = async (id: number) => {
    const filler = fillers.find((f) => f.id === id);
    const ok = await confirm({
      title: 'Dolumcuyu aktif et',
      description: `${filler?.name ?? `Dolumcu #${id}`} tekrar aktif edilecek. Stok ve talep işlemleri açılacak.`,
      confirmLabel: 'Aktif Et',
      cancelLabel: 'Vazgeç',
      variant: 'primary',
    });
    if (!ok) return;
    try {
      await fillerApi.activate(id);
      toast.success('Dolumcu aktif edildi');
      loadFillers(page);
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    if (!registerForm.latitude || !registerForm.longitude) {
      setRegisterError('"Konumu Bul" butonuna basarak konumu belirleyin.');
      return;
    }
    try {
      await fillerApi.register({
        ...registerForm,
        poolOperatorId: 0,
        latitude: Number(registerForm.latitude),
        longitude: Number(registerForm.longitude),
      });
      closeModal();
      loadFillers(0);
    } catch (err) {
      setRegisterError(handleApiError(err));
    }
  };

  const handleDeactivate = async (id: number) => {
    const filler = fillers.find((f) => f.id === id);
    const ok = await confirm({
      title: 'Dolumcuyu pasif et',
      description: `${filler?.name ?? `Dolumcu #${id}`} pasif duruma alınacak. Bu dolumcu için yeni talep oluşturulamaz, var olan planlardan etkilenmez.`,
      confirmLabel: 'Pasif Et',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await fillerApi.deactivate(id);
      toast.success('Dolumcu pasif edildi');
      loadFillers(page);
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex space-x-2">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setFilter(status); setPage(0); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-150 ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status === 'ALL' ? 'Tümü' : status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Dolumcu adına göre ara..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Toplam: <span className="font-semibold">{totalElements}</span> dolumcu
          </div>
          <button
            onClick={() => { setShowRegisterModal(true); setRegisterError(''); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Dolumcu Ekle
          </button>
        </div>
      </div>

      {fillers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-4 text-gray-600">Dolumcu bulunamadı</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fillers.map((filler) => (
            <Card key={filler.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${filler.active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{filler.name}</h3>
                    <p className="text-sm text-gray-500">ID: {filler.id}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${filler.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {filler.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-900">{filler.address.street}, {filler.address.city}</p>
                    <p className="text-xs text-gray-500">{filler.address.province} {filler.address.postalCode}, {filler.address.country}</p>
                  </div>
                </div>

                {filler.contactInfo.phone && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm text-gray-900">{filler.contactInfo.phone}</p>
                  </div>
                )}

                {filler.contactInfo.email && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-900">{filler.contactInfo.email}</p>
                  </div>
                )}

                {filler.contactInfo.contactPersonName && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm text-gray-900">{filler.contactInfo.contactPersonName}</p>
                  </div>
                )}

                {filler.taxId && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-900">Vergi No: {filler.taxId.value}</p>
                  </div>
                )}

                {filler.location.latitude && filler.location.longitude && (
                  <div className="flex items-center pt-2 border-t">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="text-xs text-gray-600">
                      Konum: {filler.location.latitude.toFixed(6)}, {filler.location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => openEdit(filler)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition duration-150"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => openUserModal(filler)}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition duration-150"
                >
                  Kullanıcı Ekle
                </button>
                {filler.active ? (
                  <button
                    onClick={() => handleDeactivate(filler.id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-150"
                  >
                    Pasif Et
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(filler.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-150"
                  >
                    Aktif Et
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Düzenleme Modalı */}
      {editingFiller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Dolumcu Düzenle — {editingFiller.name}</h3>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-5">
              {/* Temel Bilgiler */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Temel Bilgiler</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dolumcu Adı *</label>
                  <input type="text" required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Adres */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Adres</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sokak / Cadde *</label>
                    <input type="text" required
                      value={editForm.street}
                      onChange={e => setEditForm({ ...editForm, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                    <input type="text" required
                      value={editForm.city}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                    <input type="text" required
                      value={editForm.province}
                      onChange={e => setEditForm({ ...editForm, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posta Kodu *</label>
                    <input type="text" required
                      value={editForm.postalCode}
                      onChange={e => setEditForm({ ...editForm, postalCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                    <input type="text" required
                      value={editForm.country}
                      onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Konum */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Konum</h4>
                <button type="button" onClick={handleEditGeocode}
                  disabled={editGeoStatus === 'loading' || !editForm.city}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  {editGeoStatus === 'loading'
                    ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  }
                  Konumu Yenile
                </button>
                {editGeoStatus === 'error' && <p className="mt-2 text-sm text-red-600">{editGeoError}</p>}
                {editGeoStatus === 'found' && editMapCenter && (
                  <div className="mt-3">
                    {editGeoConfidence === 'low' && (
                      <div className="mb-3 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm font-semibold text-red-800">⚠️ Adres tam bulunamadı</p>
                        <p className="text-xs text-red-700 mt-1">
                          Bu adres birden fazla şehirde bulunuyor olabilir. Lütfen marker'ı haritada doğru konuma sürükleyin — yoksa rota yanlış şehre çıkar.
                        </p>
                        {editGeoMatchedDisplay && (
                          <p className="text-[11px] text-red-600 mt-1 italic">Bulunan: {editGeoMatchedDisplay}</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mb-1">İşareti sürükleyerek ince ayar yapabilirsiniz.</p>
                    <MapContainer center={editMapCenter} zoom={14}
                      style={{ height: '220px', width: '100%' }}
                      className="rounded-lg border border-gray-200">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap' />
                      <MapCenterSync center={editMapCenter} />
                      <Marker
                        position={[parseFloat(editForm.latitude), parseFloat(editForm.longitude)]}
                        draggable
                        eventHandlers={{
                          dragend(e) {
                            const { lat, lng } = (e.target as L.Marker).getLatLng();
                            setEditForm(prev => ({ ...prev, latitude: String(lat), longitude: String(lng) }));
                          }
                        }}
                      />
                    </MapContainer>
                    <p className="text-xs text-gray-400 mt-1">
                      {parseFloat(editForm.latitude).toFixed(6)}, {parseFloat(editForm.longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* İletişim */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">İletişim Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input type="text" required
                      value={editForm.contactPhone}
                      onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                    <input type="email" required
                      value={editForm.contactEmail}
                      onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi *</label>
                    <input type="text" required
                      value={editForm.contactPersonName}
                      onChange={e => setEditForm({ ...editForm, contactPersonName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150">
                  İptal
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 font-medium">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dolumcu için Kullanıcı Oluşturma Modalı */}
      {userForFiller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kullanıcı Hesabı Oluştur</h3>
                <p className="text-sm text-gray-500 mt-0.5">{userForFiller.name}</p>
              </div>
              <button onClick={closeUserModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              Filler ID <span className="font-semibold">#{userForFiller.id}</span> otomatik atanır.
              Bu dolumcuya zaten bir hesap tanımlıysa <span className="font-semibold">bilgileri güncellenecektir</span> (şifre sıfırlama için de kullanılabilir).
            </div>

            {userError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="dolumcu01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-150 font-medium disabled:opacity-50"
                >
                  {userSaving ? 'Oluşturuluyor...' : 'Hesap Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kayıt Modalı */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Yeni Dolumcu Kaydet</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {registerError && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Temel Bilgiler */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Temel Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dolumcu Adı *</label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="örn. Coca-Cola Bursa Dolum"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vergi No *</label>
                    <input
                      type="text"
                      value={registerForm.taxId}
                      onChange={e => setRegisterForm({ ...registerForm, taxId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Adres */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Adres</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sokak / Cadde *</label>
                    <input
                      type="text"
                      value={registerForm.street}
                      onChange={e => setRegisterForm({ ...registerForm, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Organize Sanayi Bölgesi 5. Cadde No:12"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                    <input
                      type="text"
                      value={registerForm.city}
                      onChange={e => setRegisterForm({ ...registerForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Bursa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe *</label>
                    <input
                      type="text"
                      value={registerForm.province}
                      onChange={e => setRegisterForm({ ...registerForm, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Osmangazi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posta Kodu *</label>
                    <input
                      type="text"
                      value={registerForm.postalCode}
                      onChange={e => setRegisterForm({ ...registerForm, postalCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="16200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke *</label>
                    <input
                      type="text"
                      value={registerForm.country}
                      onChange={e => setRegisterForm({ ...registerForm, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Konum — otomatik geocoding */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Konum</h4>
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocodeStatus === 'loading' || !registerForm.city}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  {geocodeStatus === 'loading' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  Konumu Bul
                </button>
                <p className="text-xs text-gray-400 mt-1">Adres bilgilerini doldurup butona tıklayın.</p>

                {geocodeStatus === 'error' && (
                  <p className="mt-2 text-sm text-red-600">{geocodeError}</p>
                )}

                {geocodeStatus === 'found' && mapCenter && (
                  <div className="mt-3">
                    {geocodeConfidence === 'low' && (
                      <div className="mb-3 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm font-semibold text-red-800">⚠️ Adres tam bulunamadı</p>
                        <p className="text-xs text-red-700 mt-1">
                          Bu adres birden fazla şehirde bulunuyor olabilir. Lütfen marker'ı haritada doğru konuma sürükleyin — yoksa rota yanlış şehre çıkar.
                        </p>
                        {geocodeMatchedDisplay && (
                          <p className="text-[11px] text-red-600 mt-1 italic">Bulunan: {geocodeMatchedDisplay}</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mb-1">
                      Konumu ince ayar için işareti sürükleyebilirsiniz.
                    </p>
                    <MapContainer
                      center={mapCenter}
                      zoom={14}
                      style={{ height: '220px', width: '100%' }}
                      className="rounded-lg border border-gray-200"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapCenterSync center={mapCenter} />
                      <Marker
                        position={[parseFloat(registerForm.latitude), parseFloat(registerForm.longitude)]}
                        draggable
                        eventHandlers={{
                          dragend(e) {
                            const { lat, lng } = (e.target as L.Marker).getLatLng();
                            setRegisterForm(prev => ({
                              ...prev,
                              latitude: String(lat),
                              longitude: String(lng),
                            }));
                          },
                        }}
                      />
                    </MapContainer>
                    <p className="text-xs text-gray-400 mt-1">
                      {parseFloat(registerForm.latitude).toFixed(6)}, {parseFloat(registerForm.longitude).toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* İletişim */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">İletişim Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input
                      type="text"
                      value={registerForm.contactPhone}
                      onChange={e => setRegisterForm({ ...registerForm, contactPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="02241234567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta *</label>
                    <input
                      type="email"
                      value={registerForm.contactEmail}
                      onChange={e => setRegisterForm({ ...registerForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="bursa@firma.com"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi *</label>
                    <input
                      type="text"
                      value={registerForm.contactPersonName}
                      onChange={e => setRegisterForm({ ...registerForm, contactPersonName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ahmet Yılmaz"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 font-medium"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
