import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ICON_CLASS = 'w-5 h-5 flex-shrink-0';

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operasyon',
    items: [
      {
        to: '/requests',
        label: 'Talepler',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
      {
        to: '/routes',
        label: 'Rota Optimizasyonu',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        ),
      },
      {
        to: '/plans',
        label: 'Toplama Planları',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Filo & Stok',
    items: [
      {
        to: '/fillers',
        label: 'Dolumcular',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        to: '/stocks',
        label: 'Stoklar',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        to: '/vehicles',
        label: 'Araçlar',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Yönetim',
    items: [
      {
        to: '/customers',
        label: 'Müşteriler',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
      {
        to: '/analytics',
        label: 'Analitik',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        to: '/settings',
        label: 'Ayarlar',
        icon: (
          <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    ],
  },
];

const DASHBOARD_ITEM: NavItem = {
  to: '/dashboard',
  label: 'Panel',
  icon: (
    <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

interface StaffSidebarProps {
  /** Mobile drawer açık mı (parent kontrol eder) */
  open: boolean;
  /** Mobile drawer'ı kapatmak için */
  onClose: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          flex flex-col bg-white border-r border-gray-200 shadow-sm
          transition-all duration-200
          ${collapsed ? 'lg:w-16' : 'lg:w-60'}
          w-64
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo + collapse */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center min-w-0">
            <div className="bg-indigo-600 p-2 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            {!collapsed && (
              <span className="ml-2 text-base font-bold text-gray-900 truncate">Palet Yönetim</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:block p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            title={collapsed ? 'Genişlet' : 'Daralt'}
            aria-label={collapsed ? 'Sidebar genişlet' : 'Sidebar daralt'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <SidebarLink item={DASHBOARD_ITEM} active={isActive(DASHBOARD_ITEM.to)} collapsed={collapsed} onClick={onClose} />
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mt-4">
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-gray-100 mx-2" />}
              {group.items.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  active={isActive(item.to)}
                  collapsed={collapsed}
                  onClick={onClose}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: kullanıcı bilgisi + çıkış */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {user && !collapsed && (
            <div className="px-2 py-1.5 text-xs">
              <div className="font-medium text-gray-900 truncate">{user.fullName}</div>
              <div className="text-gray-500 truncate">Personel</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Çıkış yap' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
              text-red-600 hover:bg-red-50 transition-colors duration-150
              ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Çıkış</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

const SidebarLink: React.FC<{
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick?: () => void;
}> = ({ item, active, collapsed, onClick }) => (
  <Link
    to={item.to}
    onClick={onClick}
    title={collapsed ? item.label : undefined}
    className={`
      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
      transition-colors duration-150
      ${active
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
      ${collapsed ? 'lg:justify-center' : ''}
    `}
  >
    <span className={active ? 'text-indigo-600' : 'text-gray-500'}>{item.icon}</span>
    {!collapsed && <span className="truncate">{item.label}</span>}
  </Link>
);
