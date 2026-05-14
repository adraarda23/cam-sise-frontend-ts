import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { settingsApi } from '../api/settingsApi';
import { handleApiError } from '../utils/errorHandler';
import apiClient from '../api/axiosConfig';

export const SettingsPage: React.FC = () => {
  const [minPallet, setMinPallet] = useState<number>(20);
  const [minSeparator, setMinSeparator] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // SMTP test
  const [mailTestTo, setMailTestTo] = useState<string>('');
  const [mailTesting, setMailTesting] = useState(false);
  const [mailResult, setMailResult] = useState<{ ok: boolean; detail: string } | null>(null);

  const handleSendTestMail = async () => {
    if (!mailTestTo.trim()) {
      toast.error('Hedef adres boş olamaz');
      return;
    }
    setMailTesting(true);
    setMailResult(null);
    try {
      const res = await apiClient.post('/api/admin/diagnostics/mail-test', { to: mailTestTo.trim() });
      setMailResult(res.data);
      if (res.data.ok) toast.success('Test maili gönderildi');
      else toast.error('Mail gönderilemedi');
    } catch (err: any) {
      setMailResult({ ok: false, detail: handleApiError(err) });
      toast.error('Mail gönderilemedi');
    } finally {
      setMailTesting(false);
    }
  };

  useEffect(() => {
    settingsApi.get()
      .then(s => { setMinPallet(s.minPalletRequestQty); setMinSeparator(s.minSeparatorRequestQty); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess(false);
    try {
      await settingsApi.update({ minPalletRequestQty: minPallet, minSeparatorRequestQty: minSeparator });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-2">Firma geneli yapılandırma değerleri</p>
      </div>

      <div className="max-w-lg space-y-6">
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-indigo-500 p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Minimum Toplama Miktarları</h2>
              <p className="text-sm text-gray-600">Bu değerlerin altında talep gönderilemez</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Palet Talebi (adet)
                </label>
                <input
                  type="number"
                  min={1}
                  value={minPallet}
                  onChange={e => setMinPallet(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Ayırıcı Talebi (adet)
                </label>
                <input
                  type="number"
                  min={1}
                  value={minSeparator}
                  onChange={e => setMinSeparator(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 font-medium"
              >
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-start gap-3">
              <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-700 font-medium">Ayarlar başarıyla kaydedildi.</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </Card>

        {/* SMTP test kartı — bildirim sisteminin gerçekten mail attığını doğrulamak için */}
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bildirim Servisi Testi</h2>
              <p className="text-sm text-gray-600">
                SMTP bağlantısının çalıştığını doğrulamak için kendinize bir test maili gönderin.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hedef e-posta</label>
              <input
                type="email"
                value={mailTestTo}
                onChange={(e) => setMailTestTo(e.target.value)}
                placeholder="ornek@firma.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSendTestMail}
              disabled={mailTesting}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 font-medium flex items-center justify-center gap-2"
            >
              {mailTesting && (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
              )}
              {mailTesting ? 'Gönderiliyor...' : 'Test Mailini Gönder'}
            </button>

            {mailResult && (
              <div className={`p-3 rounded text-sm ${mailResult.ok ? 'bg-green-50 border-l-4 border-green-400 text-green-700' : 'bg-red-50 border-l-4 border-red-400 text-red-700'}`}>
                <p className="font-medium">{mailResult.ok ? '✅ Mail gönderildi' : '❌ Mail başarısız'}</p>
                <p className="text-xs mt-1 break-words">{mailResult.detail}</p>
                {mailResult.ok && (
                  <p className="text-xs mt-1 text-green-600">
                    Spam/gereksiz klasörünü de kontrol etmeyi unutmayın.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};
