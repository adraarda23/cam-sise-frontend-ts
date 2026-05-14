import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notification/NotificationBell';

const adminLinks = [
  { to: '/dashboard', label: 'Panel' },
  { to: '/users', label: 'Kullanıcılar' },
];

const customerLinks = [
  { to: '/dashboard', label: 'Panel' },
  { to: '/my-requests', label: 'Taleplerim' },
];

interface NavbarProps {
  /** Mobile sidebar drawer'ını açan callback — yalnız staff layout için */
  onOpenSidebar?: () => void;
  /** Bu render staff sidebar layout'unun içinde mi? Logo'yu gizler */
  insideStaffLayout?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar, insideStaffLayout }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Yönetici';
      case 'COMPANY_STAFF': return 'Personel';
      case 'CUSTOMER': return 'Müşteri';
      default: return role;
    }
  };

  const getLinks = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return adminLinks;
    if (user.role === 'CUSTOMER') return customerLinks;
    return []; // COMPANY_STAFF uses the sidebar — top nav stays empty
  };

  const links = getLinks();
  const showLogo = !insideStaffLayout;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
      <div className={insideStaffLayout ? 'px-4 sm:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Mobile hamburger for staff sidebar */}
            {user?.role === 'COMPANY_STAFF' && (
              <button
                onClick={onOpenSidebar}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                aria-label="Menüyü aç"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            {showLogo && (
              <Link to="/dashboard" className="flex items-center">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">Palet Yönetim</span>
              </Link>
            )}

            {/* Top nav links (admin/customer only — staff uses sidebar) */}
            {links.length > 0 && (
              <div className="hidden md:flex items-center space-x-1">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                      location.pathname === link.to
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <>
                <NotificationBell />
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <div className="bg-indigo-100 px-3 py-1 rounded-full">
                    <span className="font-medium text-indigo-800">{getRoleDisplay(user.role)}</span>
                  </div>
                  <span className="text-gray-700 truncate max-w-[140px]">{user.fullName}</span>
                </div>
                {/* Staff layout'ta çıkış sidebar'da; navbar'da tekrar gösterme */}
                {!insideStaffLayout && (
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150"
                  >
                    <svg className="w-4 h-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden md:inline">Çıkış</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
