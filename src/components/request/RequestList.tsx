import React, { useEffect, useState } from 'react';
import { collectionApi } from '../../api/collectionApi';
import { fillerApi } from '../../api/fillerApi';
import { CollectionRequest, Filler } from '../../types/api.types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';

const PAGE_SIZE = 10; // 2 records per filler → 5 filler groups per page

type RequestGroup = {
  fillerId: number;
  pallet?: CollectionRequest;
  separator?: CollectionRequest;
};

export const RequestList: React.FC = () => {
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadRequests(page);
  }, [page, filter]);

  const loadRequests = async (p: number) => {
    try {
      setIsLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [data, fillersData] = await Promise.all([
        collectionApi.getAll({ status, page: p, size: PAGE_SIZE }),
        fillerApi.getAll({ page: 0, size: 1000 }),
      ]);
      setRequests(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setFillers(fillersData.content);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getFillerName = (fillerId: number) => {
    const f = fillers.find(f => f.id === fillerId);
    return f ? f.name : `Dolumcu #${fillerId}`;
  };

  // Group by fillerId — per assetType keep the highest-id (most recent) record
  const groupedRequests: RequestGroup[] = Object.values(
    requests.reduce<Record<number, RequestGroup>>((acc, req) => {
      if (!acc[req.fillerId]) acc[req.fillerId] = { fillerId: req.fillerId };
      const key = req.assetType === 'PALLET' ? 'pallet' : 'separator';
      const existing = acc[req.fillerId][key];
      if (!existing || req.id > existing.id) acc[req.fillerId][key] = req;
      return acc;
    }, {})
  );

  const pendingIn = (group: RequestGroup) =>
    [group.pallet, group.separator].filter(r => r?.status === 'PENDING').map(r => r!.id);

  const handleApproveGroup = async (group: RequestGroup) => {
    const ids = pendingIn(group);
    if (!ids.length) return;
    if (!window.confirm('Bu gruptaki talepleri onaylamak istiyor musunuz?')) return;
    try {
      await Promise.all(ids.map(id => collectionApi.approveRequest(id, 1)));
      loadRequests(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleRejectGroup = async (group: RequestGroup) => {
    const ids = pendingIn(group);
    if (!ids.length) return;
    const reason = prompt('Reddetme sebebini giriniz:');
    if (!reason) return;
    try {
      await Promise.all(ids.map(id => collectionApi.rejectRequest(id, reason)));
      loadRequests(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      ALL: 'Tümü',
      PENDING: 'Beklemede',
      APPROVED: 'Onaylandı',
      REJECTED: 'Reddedildi',
      SCHEDULED: 'Planlandı',
      COMPLETED: 'Tamamlandı',
      CANCELLED: 'İptal Edildi',
    };
    return labels[status] || status;
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 flex-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition duration-150 ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
          <span className="font-semibold text-indigo-600">{groupedRequests.length}</span> dolumcu
        </div>
      </div>

      {groupedRequests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-4 text-gray-600">Talep bulunamadı</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groupedRequests.map((group) => {
            const hasPending = pendingIn(group).length > 0;
            const rejectionReason = group.pallet?.rejectionReason || group.separator?.rejectionReason;
            const createdAt = group.pallet?.createdAt || group.separator?.createdAt;
            return (
              <Card key={group.fillerId}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {getFillerName(group.fillerId)}
                      </h3>
                      {createdAt && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>

                    {/* Asset rows */}
                    <div className="space-y-3">
                      {[
                        { req: group.pallet, label: 'Palet' },
                        { req: group.separator, label: 'Ayırıcı' },
                      ].map(({ req, label }) =>
                        req ? (
                          <div key={req.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700 w-16">{label}</span>
                              <span className="text-sm text-gray-900 font-semibold">{req.estimatedQuantity} adet</span>
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
                      <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded">
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Red Sebebi:</span> {rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {hasPending && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveGroup(group)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-150 whitespace-nowrap"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => handleRejectGroup(group)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-150 whitespace-nowrap"
                      >
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
