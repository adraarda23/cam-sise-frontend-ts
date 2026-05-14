import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { NotificationItem } from '../../types/api.types';

/**
 * Navbar'a yerleştirilen bildirim çanı.
 * - Polling (30s) ile unread sayısını yeniler
 * - Dropdown'da son 10 bildirimi listeler
 * - Her satıra tıklanınca okundu işaretler ve actionUrl'e yönlendirir
 * - "Tümünü Okundu İşaretle" toplu işlem butonu
 */
export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  // Always show the last 5 notifications, read or unread, so the bell is a
  // recency feed not a filtered inbox.
  const { data: notificationList, isLoading } = useNotifications({ page: 0, size: 5 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleClickItem = (n: NotificationItem) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Bildirimler"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-anomaly-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[480px] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-sm text-gray-700">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {isLoading && (
            <div className="p-6 text-center text-sm text-gray-500">Yükleniyor...</div>
          )}

          {!isLoading && (!notificationList?.content || notificationList.content.length === 0) && (
            <div className="p-6 text-center text-sm text-gray-500">Bildirim yok</div>
          )}

          <ul>
            {notificationList?.content.map((n) => (
              <li
                key={n.id}
                className={`border-b border-gray-100 last:border-b-0 ${
                  !n.read ? 'bg-indigo-50/40' : ''
                }`}
              >
                <NotificationRow notification={n} onClick={() => handleClickItem(n)} />
              </li>
            ))}
          </ul>

          <div className="p-2 text-center border-t border-gray-100 bg-gray-50">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Tüm bildirimleri gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationRow: React.FC<{ notification: NotificationItem; onClick: () => void }> = ({
  notification,
  onClick,
}) => {
  const severityClasses =
    notification.severity === 'CRITICAL'
      ? 'border-l-anomaly-500'
      : notification.severity === 'WARNING'
        ? 'border-l-estimated-500'
        : 'border-l-info-500';

  const icon =
    notification.severity === 'CRITICAL'
      ? '⚠️'
      : notification.severity === 'WARNING'
        ? '⚡'
        : 'ℹ️';

  const body = (
    <div
      className={`px-3 py-2 border-l-4 ${severityClasses} cursor-pointer hover:bg-gray-50`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
            {notification.title}
          </p>
          {notification.body && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.body}</p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">{formatRelative(notification.createdAt)}</p>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return <Link to={notification.actionUrl}>{body}</Link>;
  }
  return body;
};

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.round(diffMs / 60_000);
    if (diffMin < 1) return 'az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH} sa önce`;
    const diffD = Math.round(diffH / 24);
    return `${diffD} gün önce`;
  } catch {
    return iso;
  }
}
