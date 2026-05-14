import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { collectionApi } from '../../api/collectionApi';
import { fillerApi } from '../../api/fillerApi';
import { CollectionRequest, Filler } from '../../types/api.types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';
import { useConfirm } from '../common/ConfirmDialog';
import { useInputDialog } from '../common/InputDialog';

// Backend kayıt-bazlı paginate ediyor; ama biz UI'da dolumcuya göre gruplayıp
// gösteriyoruz. Bu yüzden tek bir dolumcunun birkaç kaydı tüm sayfayı dolduruyordu.
// Çözüm: büyük bir batch çekip grupları frontend'de paginate et (4 grup/sayfa).
const BACKEND_FETCH_SIZE = 500;
const GROUPS_PER_PAGE = 4;

type RequestGroup = {
  fillerId: number;
  pallet?: CollectionRequest;
  separator?: CollectionRequest;
};

export const RequestList: React.FC = () => {
  const confirm = useConfirm();
  const askInput = useInputDialog();
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  useEffect(() => {
    loadRequests();
    setPage(0);
  }, [filter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [data, fillersData] = await Promise.all([
        collectionApi.getAll({ status, page: 0, size: BACKEND_FETCH_SIZE }),
        fillerApi.getAll({ page: 0, size: 1000 }),
      ]);
      setRequests(data.content);
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
  const allGroups: RequestGroup[] = Object.values(
    requests.reduce<Record<number, RequestGroup>>((acc, req) => {
      if (!acc[req.fillerId]) acc[req.fillerId] = { fillerId: req.fillerId };
      const key = req.assetType === 'PALLET' ? 'pallet' : 'separator';
      const existing = acc[req.fillerId][key];
      if (!existing || req.id > existing.id) acc[req.fillerId][key] = req;
      return acc;
    }, {})
  );

  // En yeni gruplar yukarıda olsun (max id'ye göre desc)
  allGroups.sort((a, b) => {
    const aMax = Math.max(a.pallet?.id ?? 0, a.separator?.id ?? 0);
    const bMax = Math.max(b.pallet?.id ?? 0, b.separator?.id ?? 0);
    return bMax - aMax;
  });

  const totalGroups = allGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / GROUPS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const groupedRequests = allGroups.slice(safePage * GROUPS_PER_PAGE, (safePage + 1) * GROUPS_PER_PAGE);

  const pendingIn = (group: RequestGroup) =>
    [group.pallet, group.separator].filter(r => r?.status === 'PENDING').map(r => r!.id);

  const handleApproveGroup = async (group: RequestGroup) => {
    const ids = pendingIn(group);
    if (!ids.length) return;
    const fillerName = getFillerName(group.fillerId);
    const ok = await confirm({
      title: 'Talepleri onayla',
      description: `${fillerName} için bekleyen ${ids.length} talep onaylanacak. Bu işlem stok rezervasyonunu kalıcı yapar.`,
      confirmLabel: 'Onayla',
      cancelLabel: 'Vazgeç',
      variant: 'primary',
    });
    if (!ok) return;
    try {
      await Promise.all(ids.map(id => collectionApi.approveRequest(id, 1)));
      toast.success('Talepler onaylandı');
      loadRequests();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleRejectGroup = async (group: RequestGroup) => {
    const ids = pendingIn(group);
    if (!ids.length) return;
    const fillerName = getFillerName(group.fillerId);
    const values = await askInput({
      title: 'Talepleri reddet',
      description: `${fillerName} için ${ids.length} bekleyen talep reddedilecek. Reddetme sebebi gerekiyor.`,
      confirmLabel: 'Reddet',
      cancelLabel: 'Vazgeç',
      fields: [
        {
          name: 'reason',
          label: 'Reddetme sebebi',
          type: 'text',
          placeholder: 'örn: Yeterli stok yok',
        },
      ],
    });
    if (!values) return;
    const reason = (values.reason ?? '').trim();
    if (!reason) {
      toast.error('Reddetme sebebi zorunlu');
      return;
    }
    try {
      await Promise.all(ids.map(id => collectionApi.rejectRequest(id, reason)));
      toast.success('Talepler reddedildi');
      loadRequests();
    } catch (err) {
      toast.error(handleApiError(err));
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
          <span className="font-semibold text-indigo-600">{totalGroups}</span> dolumcu
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
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-3 border-b">
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
                  <div className="space-y-2.5">
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
                    <div className="bg-anomaly-50 border-l-4 border-anomaly-400 p-3 rounded">
                      <p className="text-sm text-anomaly-700">
                        <span className="font-medium">Red Sebebi:</span> {rejectionReason}
                      </p>
                    </div>
                  )}

                  {hasPending && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleRejectGroup(group)}
                        className="px-4 py-2 bg-white border border-anomaly-300 text-anomaly-700 text-sm font-medium rounded-lg hover:bg-anomaly-50 transition duration-150"
                      >
                        Reddet
                      </button>
                      <button
                        onClick={() => handleApproveGroup(group)}
                        className="px-4 py-2 bg-actual-600 text-white text-sm font-medium rounded-lg hover:bg-actual-700 transition duration-150"
                      >
                        Onayla
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
        page={safePage}
        totalPages={totalPages}
        totalElements={totalGroups}
        size={GROUPS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
};
