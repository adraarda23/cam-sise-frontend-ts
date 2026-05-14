import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { fillerApi } from '../../api/fillerApi';
import { collectionApi } from '../../api/collectionApi';
import { routeApi } from '../../api/routeApi';

export const StaffDashboard: React.FC = () => {
  const [totalFillers, setTotalFillers] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [activePlans, setActivePlans] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      // Load all stats in parallel
      const [fillers, requests, plans] = await Promise.all([
        fillerApi.getAll({ active: true, page: 0, size: 1 }),
        collectionApi.getAll({ status: 'PENDING', page: 0, size: 1 }),
        routeApi.getCollectionPlans({ page: 0, size: 1000 }),
      ]);

      setTotalFillers(fillers.totalElements);
      setPendingRequests(requests.totalElements);
      setActivePlans(
        plans.content.filter(p =>
          p.status === 'GENERATED' ||
          p.status === 'ASSIGNED' ||
          p.status === 'IN_PROGRESS'
        ).length
      );
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Rota Optimizasyonu',
      description: 'Çoklu araç rota planlaması (CVRP)',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      link: '/routes',
      color: 'bg-blue-500',
    },
    {
      title: 'Toplama Talepleri',
      description: 'Talep onaylama ve yönetimi',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      link: '/requests',
      color: 'bg-green-500',
    },
    {
      title: 'Dolumcular',
      description: 'Dolumcu kayıt ve yönetimi',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      link: '/fillers',
      color: 'bg-purple-500',
    },
    {
      title: 'Stok Yönetimi',
      description: 'Stok takibi ve giriş/çıkış kaydı',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      link: '/stocks',
      color: 'bg-yellow-500',
    },
    {
      title: 'Toplama Planları',
      description: 'Aktif ve tamamlanmış planlar',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/plans',
      color: 'bg-indigo-500',
    },
    {
      title: 'Araç Yönetimi',
      description: 'Araç kayıt ve durum yönetimi',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      link: '/vehicles',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Personel Paneli</h1>
        <p className="text-indigo-100">Havuz operasyonları ve lojistik yönetimi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Link key={item.link} to={item.link}>
            <Card className="hover:shadow-xl transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-start space-x-4">
                <div className={`${item.color} text-white p-3 rounded-lg`}>
                  {item.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Toplam Aktif Dolumcu</p>
              {isLoading ? (
                <div className="animate-pulse bg-blue-300 h-9 w-16 rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-blue-900 mt-1">{totalFillers}</p>
              )}
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Bekleyen Talep</p>
              {isLoading ? (
                <div className="animate-pulse bg-green-300 h-9 w-16 rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-green-900 mt-1">{pendingRequests}</p>
              )}
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Aktif Plan</p>
              {isLoading ? (
                <div className="animate-pulse bg-purple-300 h-9 w-16 rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-purple-900 mt-1">{activePlans}</p>
              )}
            </div>
            <div className="bg-purple-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
