import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Layout } from '../components/common/Layout';
import { useAuth } from '../context/AuthContext';
import { userApi, UserResponse, CreateStaffRequest, CreateCustomerRequest } from '../api/userApi';
import { fillerApi } from '../api/fillerApi';
import { Filler } from '../types/api.types';
import { Pagination } from '../components/common/Pagination';
import { useConfirm } from '../components/common/ConfirmDialog';

const emptyStaffForm: CreateStaffRequest = { username: '', password: '', fullName: '' };
const emptyCustomerForm: CreateCustomerRequest = { username: '', password: '', fullName: '', fillerId: null };

export const UsersPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const confirm = useConfirm();
  const isAdmin = authUser?.role === 'ADMIN';

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const PAGE_SIZE = 5;
  const [showModal, setShowModal] = useState(false);
  const [staffForm, setStaffForm] = useState<CreateStaffRequest>(emptyStaffForm);
  const [customerForm, setCustomerForm] = useState<CreateCustomerRequest>(emptyCustomerForm);
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // edit state
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const load = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getAll({ page: p, size: PAGE_SIZE, search: debouncedSearch || undefined });
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Load active fillers once (only needed for COMPANY_STAFF creating customers)
  useEffect(() => {
    if (!isAdmin) {
      fillerApi.getAll({ active: true, page: 0, size: 1000 })
        .then(d => setFillers(d.content))
        .catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setDebouncedSearch(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(page); }, [page, debouncedSearch]);

  const getFillerName = (fillerId: number | null) => {
    if (!fillerId) return '-';
    const f = fillers.find(f => f.id === fillerId);
    return f ? f.name : `Dolumcu #${fillerId}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isAdmin) {
        await userApi.createStaff(staffForm);
      } else {
        await userApi.createCustomer(customerForm);
      }
      setShowModal(false);
      setStaffForm(emptyStaffForm);
      setCustomerForm(emptyCustomerForm);
      await load(0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Kullanıcı oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserResponse) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPassword('');
    setEditError('');
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditFullName('');
    setEditPassword('');
    setEditError('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      await userApi.update(editingUser.id, {
        fullName: editFullName,
        password: editPassword || undefined,
      });
      closeEdit();
      await load(0);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Güncelleme başarısız.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeactivate = async (userId: number) => {
    const targetUser = users.find((u) => u.id === userId);
    const ok = await confirm({
      title: 'Kullanıcıyı devre dışı bırak',
      description: `${targetUser?.fullName ?? `Kullanıcı #${userId}`} (${targetUser?.username ?? ''}) artık giriş yapamaz. Hesap silinmez, daha sonra tekrar aktif edilebilir.`,
      confirmLabel: 'Devre Dışı Bırak',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await userApi.deactivate(userId);
      toast.success('Kullanıcı devre dışı bırakıldı');
      await load(page);
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const pageTitle = isAdmin ? 'Personel Yönetimi' : 'Müşteri Yönetimi';
  const pageSubtitle = isAdmin ? 'Tenant\'ınıza ait sistem personelleri' : 'Tenant\'ınıza ait müşteri hesapları';
  const addLabel = isAdmin ? '+ Yeni Personel' : '+ Yeni Müşteri';
  const roleLabel = isAdmin ? 'Personel' : 'Müşteri';

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-gray-500">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ad veya kullanıcı adına göre ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64"
              />
            </div>
            <button
              onClick={() => { setShowModal(true); setError(null); }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 whitespace-nowrap"
            >
              {addLabel}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : (
          <>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı Adı</th>
                  {!isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dolumcu</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kayıt Tarihi</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.id} className={!u.active ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                    {!isAdmin && (
                      <td className="px-6 py-4 text-sm text-gray-700">{getFillerName(u.fillerId)}</td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {u.active && (
                        <button onClick={() => openEdit(u)}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                          Düzenle
                        </button>
                      )}
                      {u.active && (
                        <button onClick={() => handleDeactivate(u.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium">
                          Devre Dışı
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={!isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                      Henüz {isAdmin ? 'personel' : 'müşteri'} yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            size={PAGE_SIZE}
            onPageChange={setPage}
          />
          </>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isAdmin ? 'Yeni Personel Oluştur' : 'Yeni Müşteri Oluştur'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
                )}
                {isAdmin ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                      <input type="text" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={staffForm.fullName}
                        onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })}
                        placeholder="Ahmet Yılmaz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                      <input type="text" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={staffForm.username}
                        onChange={e => setStaffForm({ ...staffForm, username: e.target.value })}
                        placeholder="staff01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                      <input type="password" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={staffForm.password}
                        onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                      <input type="text" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={customerForm.fullName}
                        onChange={e => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                        placeholder="Veli Çelik"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kullanıcı Adı *</label>
                      <input type="text" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={customerForm.username}
                        onChange={e => setCustomerForm({ ...customerForm, username: e.target.value })}
                        placeholder="musteri01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Şifre *</label>
                      <input type="password" required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={customerForm.password}
                        onChange={e => setCustomerForm({ ...customerForm, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dolumcu</label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={customerForm.fillerId ?? ''}
                        onChange={e => setCustomerForm({ ...customerForm, fillerId: e.target.value ? Number(e.target.value) : null })}
                      >
                        <option value="">— Seçiniz —</option>
                        {fillers.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    İptal
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Düzenle — {editingUser.username}</h2>
                <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleEdit} className="px-6 py-4 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{editError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
                  <input type="text" required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre <span className="text-gray-400 font-normal">(boş bırakılırsa değişmez)</span>
                  </label>
                  <input type="password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button type="button" onClick={closeEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    İptal
                  </button>
                  <button type="submit" disabled={editSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {editSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
