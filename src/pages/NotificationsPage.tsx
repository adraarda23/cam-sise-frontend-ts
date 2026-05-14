import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { NotificationItem } from '../types/api.types';

/**
 * Tüm bildirimlerin listesi ve filtreleme.
 * NotificationBell dropdown'dan "Tüm bildirimleri gör" linki buraya gelir.
 */
export const NotificationsPage: React.FC = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data, isLoading, error } = useNotifications({ unreadOnly, page, size: pageSize });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bildirimler</h1>
            <p className="text-sm text-info-500">Sistem ve anomali bildirimleri</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-info-700">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setPage(0);
                }}
              />
              Sadece okunmamış
            </label>
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Tümünü okundu işaretle
            </button>
          </div>
        </div>

        <Card>
          {isLoading && <p className="text-sm text-info-500">Yükleniyor...</p>}
          {error && (
            <p className="text-sm text-anomaly-700 bg-anomaly-50 p-3 rounded">
              Bildirimler yüklenemedi.
            </p>
          )}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-info-500 italic py-8 text-center">Bildirim yok.</p>
          )}
          {items.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    onMarkRead={() => markRead.mutate(n.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {totalElements > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
            <span className="text-info-500">
              Toplam <strong className="text-info-700">{totalElements}</strong> bildirim
              {totalPages > 1 && ` · Sayfa ${page + 1} / ${totalPages}`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  title="İlk sayfa"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Önceki
                </button>
                <span className="px-3 py-1 text-xs bg-indigo-600 text-white rounded">
                  {page + 1}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Sonraki →
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                  title="Son sayfa"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

const NotificationRow: React.FC<{
  notification: NotificationItem;
  onMarkRead: () => void;
}> = ({ notification, onMarkRead }) => {
  const severityClasses =
    notification.severity === 'CRITICAL'
      ? 'border-l-anomaly-500 bg-anomaly-50/30'
      : notification.severity === 'WARNING'
        ? 'border-l-estimated-500 bg-estimated-50/30'
        : 'border-l-info-500';
  const icon =
    notification.severity === 'CRITICAL'
      ? '⚠️'
      : notification.severity === 'WARNING'
        ? '⚡'
        : 'ℹ️';

  return (
    <div className={`px-4 py-3 border-l-4 ${severityClasses}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className={notification.read ? 'text-gray-600' : 'font-semibold text-gray-900'}>
              {notification.title}
            </p>
            <span className="text-xs text-info-500 whitespace-nowrap">
              {new Date(notification.createdAt).toLocaleString('tr-TR')}
            </span>
          </div>
          {notification.body && (
            <p className="text-sm text-info-700 mt-1 whitespace-pre-wrap">{notification.body}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                notification.severity === 'CRITICAL'
                  ? 'bg-anomaly-100 text-anomaly-700'
                  : notification.severity === 'WARNING'
                    ? 'bg-estimated-100 text-estimated-700'
                    : 'bg-info-100 text-info-700'
              }`}
            >
              {notification.severity}
            </span>
            {notification.actionUrl && (
              <Link
                to={notification.actionUrl}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Detay →
              </Link>
            )}
            {!notification.read && (
              <button
                onClick={onMarkRead}
                className="text-xs text-info-500 hover:text-info-700"
              >
                Okundu işaretle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
