import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { ManualRequestForm } from '../components/request/ManualRequestForm';
import { useAuth } from '../context/AuthContext';
import { collectionApi } from '../api/collectionApi';
import { CollectionRequest } from '../types/api.types';
import { Card } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { handleApiError } from '../utils/errorHandler';

export const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.fillerId) {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadRequests = async () => {
    if (!user?.fillerId) return;

    try {
      setIsLoading(true);
      const data = await collectionApi.getByFiller(user.fillerId);
      setRequests(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await collectionApi.cancelRequest(requestId);
      loadRequests();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleCancelGroup = async (ids: number[]) => {
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    try {
      await Promise.all(ids.map(id => collectionApi.cancelRequest(id)));
      loadRequests();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  // Pair PALLET+SEPARATOR requests created within 60s of each other
  const groupedRequests = (() => {
    const sorted = [...requests].sort((a, b) => b.id - a.id);
    const used = new Set<number>();
    const groups: { pallet?: CollectionRequest; separator?: CollectionRequest }[] = [];

    for (const req of sorted) {
      if (used.has(req.id)) continue;
      const partner = sorted.find(
        r => !used.has(r.id) && r.id !== req.id &&
             r.assetType !== req.assetType &&
             Math.abs(new Date(r.createdAt).getTime() - new Date(req.createdAt).getTime()) < 60_000
      );
      if (partner) {
        used.add(req.id);
        used.add(partner.id);
        groups.push({
          pallet: req.assetType === 'PALLET' ? req : partner,
          separator: req.assetType === 'SEPARATOR' ? req : partner,
        });
      } else {
        used.add(req.id);
        groups.push(req.assetType === 'PALLET' ? { pallet: req } : { separator: req });
      }
    }
    return groups;
  })();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Toplama Taleplerim</h1>
        <p className="text-gray-600 mt-2">
          Yeni talep oluşturun ve mevcut taleplerinizi takip edin
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManualRequestForm onSuccess={loadRequests} />

        <Card title="Talep Geçmişi">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="mt-2 text-gray-600">Henüz talep bulunmuyor</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {groupedRequests.map((group, idx) => {
                const first = group.pallet ?? group.separator!;
                const pendingIds = [group.pallet, group.separator]
                  .filter(r => r?.status === 'PENDING')
                  .map(r => r!.id);
                const rejectionReason = group.pallet?.rejectionReason || group.separator?.rejectionReason;
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition duration-150">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-400">
                        {new Date(first.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {[
                        { req: group.pallet, label: 'Palet' },
                        { req: group.separator, label: 'Ayırıcı' },
                      ].map(({ req, label }) =>
                        req ? (
                          <div key={req.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 w-16">{label}</span>
                              <span className="text-sm text-gray-900">{req.estimatedQuantity} adet</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">#{req.id}</span>
                              <StatusBadge status={req.status} />
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>

                    {rejectionReason && (
                      <p className="text-xs text-red-600 mb-2">
                        <span className="font-medium">Red Sebebi:</span> {rejectionReason}
                      </p>
                    )}

                    {pendingIds.length > 0 && (
                      <button
                        onClick={() => handleCancelGroup(pendingIds)}
                        className="w-full text-sm bg-red-50 text-red-600 py-2 px-3 rounded hover:bg-red-100 transition duration-150"
                      >
                        Talebi İptal Et
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};
