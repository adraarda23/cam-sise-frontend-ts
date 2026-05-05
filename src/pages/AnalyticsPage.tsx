import React, { useEffect, useState } from 'react';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { analyticsApi } from '../api/analyticsApi';
import { AnalyticsSummary } from '../types/api.types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  SCHEDULED: 'Planlandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  GENERATED: 'Oluşturuldu',
  ASSIGNED: 'Atandı',
  IN_PROGRESS: 'Devam Ediyor',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-400',
  APPROVED: 'bg-blue-400',
  SCHEDULED: 'bg-indigo-400',
  COMPLETED: 'bg-green-500',
  REJECTED: 'bg-red-400',
  CANCELLED: 'bg-gray-400',
  GENERATED: 'bg-purple-400',
  ASSIGNED: 'bg-blue-500',
  IN_PROGRESS: 'bg-orange-400',
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color = 'bg-indigo-500' }) => (
  <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
    <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
      <div className="w-5 h-5 bg-white opacity-80 rounded-sm" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm font-medium text-gray-600 mt-1">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

interface BarChartProps {
  data: Record<string, number>;
  total: number;
}

const StatusBar: React.FC<BarChartProps> = ({ data, total }) => {
  if (total === 0) return <p className="text-sm text-gray-400">Veri yok</p>;
  return (
    <div className="space-y-2 mt-2">
      {Object.entries(data).map(([status, count]) => {
        const pct = Math.round((count / total) * 100);
        return (
          <div key={status}>
            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
              <span>{STATUS_LABELS[status] ?? status}</span>
              <span>{count} ({pct}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analyticsApi.getSummary()
      .then(setData)
      .catch(() => setError('Veriler yüklenirken bir hata oluştu.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error || 'Veri bulunamadı.'}</p>
        </div>
      </Layout>
    );
  }

  const completedRequests = data.requestsByStatus['COMPLETED'] ?? 0;
  const completionRate = data.totalRequests > 0
    ? Math.round((completedRequests / data.totalRequests) * 100)
    : 0;

  const completedPlans = data.plansByStatus['COMPLETED'] ?? 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analitik</h1>
        <p className="text-gray-600 mt-1">Toplama, rota ve stok özeti</p>
      </div>

      {/* Toplama İstatistikleri */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Toplama Talepleri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Toplam Talep" value={data.totalRequests} color="bg-indigo-500" />
          <StatCard label="Tamamlanan" value={completedRequests} sub={`%${completionRate} tamamlanma`} color="bg-green-500" />
          <StatCard label="Palet Talebi" value={data.palletRequests} color="bg-blue-500" />
          <StatCard label="Ayırıcı Talebi" value={data.separatorRequests} color="bg-purple-500" />
        </div>
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Durum Dağılımı</h3>
          <StatusBar data={data.requestsByStatus} total={data.totalRequests} />
        </Card>
      </section>

      {/* Rota Verimliliği */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Rota Verimliliği</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Toplam Plan" value={data.totalPlans} color="bg-orange-500" />
          <StatCard label="Tamamlanan Plan" value={completedPlans} color="bg-green-500" />
          <StatCard
            label="Ort. Mesafe"
            value={`${data.avgDistanceKm.toFixed(1)} km`}
            color="bg-yellow-500"
          />
          <StatCard
            label="Ort. Süre"
            value={`${Math.round(data.avgDurationMinutes)} dk`}
            color="bg-teal-500"
          />
        </div>
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan Durum Dağılımı</h3>
          <StatusBar data={data.plansByStatus} total={data.totalPlans} />
        </Card>
      </section>

      {/* Stok Durumu */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Stok Durumu</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Toplam Dolumcu" value={data.totalFillers} color="bg-gray-500" />
          <StatCard
            label="Toplam Palet Stoku"
            value={data.totalPalletStock.toLocaleString('tr-TR')}
            color="bg-blue-500"
          />
          <StatCard
            label="Toplam Ayırıcı Stoku"
            value={data.totalSeparatorStock.toLocaleString('tr-TR')}
            color="bg-purple-500"
          />
          <StatCard
            label="Eşik Aşan Dolumcular"
            value={data.fillersWithLowPalletStock + data.fillersWithLowSeparatorStock}
            sub="Palet + Ayırıcı"
            color="bg-red-500"
          />
        </div>
      </section>
    </Layout>
  );
};
