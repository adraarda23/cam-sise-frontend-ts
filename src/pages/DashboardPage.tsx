import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/common/Layout';
import { StaffDashboard } from '../components/dashboard/StaffDashboard';
import { CustomerDashboard } from '../components/dashboard/CustomerDashboard';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yönetici Paneli</h1>
        <p className="mt-1 text-sm text-gray-500">Hoş geldiniz, {user?.fullName}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/users"
          className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
              <p className="text-sm text-gray-500">Personel ve müşteri hesaplarını yönetin</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard />;
      case 'COMPANY_STAFF':
        return <StaffDashboard />;
      case 'CUSTOMER':
        return <CustomerDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Rol bilgisi bulunamadı</p>
          </div>
        );
    }
  };

  return <Layout>{renderDashboard()}</Layout>;
};
