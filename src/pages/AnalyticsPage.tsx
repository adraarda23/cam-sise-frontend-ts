import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { ActualValue } from '../components/common/ActualValue';
import { EstimatedValue } from '../components/common/EstimatedValue';
import { analyticsApi } from '../api/analyticsApi';
import { useNotifications } from '../hooks/useNotifications';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, Cell,
} from 'recharts';

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
  PENDING: '#f59e0b',
  APPROVED: '#3b82f6',
  SCHEDULED: '#8b5cf6',
  COMPLETED: '#22c55e',
  REJECTED: '#ef4444',
  CANCELLED: '#94a3b8',
  GENERATED: '#a855f7',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#fb923c',
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: 'default' | 'actual' | 'estimated' | 'anomaly';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, accent = 'default' }) => {
  const ring = accent === 'anomaly' ? 'border-anomaly-300'
    : accent === 'estimated' ? 'border-estimated-300'
    : accent === 'actual' ? 'border-actual-300'
    : 'border-gray-200';
  return (
    <div className={`bg-white rounded-lg shadow border ${ring} p-5`}>
      <p className="text-sm font-medium text-info-500">{label}</p>
      <div className="mt-2">{value}</div>
      {sub && <p className="text-xs text-info-500 mt-1">{sub}</p>}
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const summaryQuery = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  });

  const anomalyNotifications = useNotifications({ unreadOnly: false, page: 0, size: 20 });

  if (summaryQuery.isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }
  if (summaryQuery.error || !summaryQuery.data) {
    return (
      <Layout>
        <div className="bg-anomaly-50 border-l-4 border-anomaly-500 p-4 rounded">
          <p className="text-anomaly-700">Veriler yüklenirken bir hata oluştu.</p>
        </div>
      </Layout>
    );
  }

  const data = summaryQuery.data;
  const completedRequests = data.requestsByStatus['COMPLETED'] ?? 0;
  const completionRate = data.totalRequests > 0 ? Math.round((completedRequests / data.totalRequests) * 100) : 0;
  const completedPlans = data.plansByStatus['COMPLETED'] ?? 0;

  const requestStatusData = Object.entries(data.requestsByStatus).map(([k, v]) => ({
    status: STATUS_LABELS[k] ?? k,
    rawStatus: k,
    count: v,
  }));
  const planStatusData = Object.entries(data.plansByStatus).map(([k, v]) => ({
    status: STATUS_LABELS[k] ?? k,
    rawStatus: k,
    count: v,
  }));

  const anomalyItems = (anomalyNotifications.data?.content ?? []).filter((n) => n.type === 'STOCK_ANOMALY');

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analitik</h1>
        <p className="text-gray-600 mt-1">Toplama, rota, stok özeti ve anomali akışı</p>
      </div>

      {/* Anomaly band */}
      {data.criticalAnomalyCount24h > 0 && (
        <div className="mb-6 bg-anomaly-50 border-l-4 border-anomaly-500 p-4 rounded flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-anomaly-700">
              Son 24 saatte {data.criticalAnomalyCount24h} kritik anomali tespit edildi
            </p>
            <p className="text-sm text-anomaly-600 mt-1">
              Toplam {data.anomalyCount24h} anomali kaydı. Bildirim panelinden detayları görüntüleyin.
            </p>
          </div>
        </div>
      )}

      {/* Top KPI'lar */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Toplam Talep"
          value={<ActualValue value={data.totalRequests} size="xl" />}
        />
        <KpiCard
          label="Tamamlanan Talep"
          value={<ActualValue value={completedRequests} size="xl" />}
          sub={`%${completionRate} tamamlanma`}
          accent="actual"
        />
        <KpiCard
          label="Toplam Plan"
          value={<ActualValue value={data.totalPlans} size="xl" />}
        />
        <KpiCard
          label="Tamamlanan Plan"
          value={<ActualValue value={completedPlans} size="xl" />}
          accent="actual"
        />
      </section>

      {/* Route stats */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Ort. Mesafe (tahmini)"
          value={
            <EstimatedValue
              value={data.avgDistanceKm}
              stdDev={data.stdDevDistanceKm}
              sampleSize={Math.max(1, data.totalPlans)}
              unit="km"
              size="lg"
              precision={1}
            />
          }
          accent="estimated"
        />
        <KpiCard
          label="Medyan Mesafe"
          value={<EstimatedValue value={data.medianDistanceKm} unit="km" showRange={false} size="lg" />}
          accent="estimated"
        />
        <KpiCard
          label="P95 Mesafe"
          value={<EstimatedValue value={data.p95DistanceKm} unit="km" showRange={false} size="lg" />}
          accent="estimated"
        />
        <KpiCard
          label="Ort. Süre"
          value={<EstimatedValue value={data.avgDurationMinutes} unit="dk" showRange={false} size="lg" precision={0} />}
          accent="estimated"
        />
      </section>

      {/* Stock stats */}
      <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Dolumcular" value={<ActualValue value={data.totalFillers} size="lg" />} />
        <KpiCard
          label="Toplam Palet Stoku"
          value={<ActualValue value={data.totalPalletStock.toLocaleString('tr-TR')} size="lg" />}
          accent="actual"
        />
        <KpiCard
          label="Toplam Ayırıcı Stoku"
          value={<ActualValue value={data.totalSeparatorStock.toLocaleString('tr-TR')} size="lg" />}
          accent="actual"
        />
        <KpiCard
          label="Eşiği Aşan Dolumcular"
          value={<ActualValue value={data.fillersWithLowPalletStock + data.fillersWithLowSeparatorStock} size="lg" />}
          sub="Palet + Ayırıcı"
          accent="anomaly"
        />
      </section>

      {/* Chart row */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Talep Durumu Dağılımı">
          {requestStatusData.length === 0 ? (
            <p className="text-sm text-info-500">Veri yok</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Adet">
                    {requestStatusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.rawStatus] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Plan Durumu Dağılımı">
          {planStatusData.length === 0 ? (
            <p className="text-sm text-info-500">Veri yok</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Adet">
                    {planStatusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.rawStatus] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>

      {/* Anomaly stream */}
      <section>
        <Card title="Anomali Akışı (Son 20)">
          {anomalyItems.length === 0 ? (
            <p className="text-sm text-info-500 italic">Henüz anomali tespit edilmedi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-info-700">
                    <th className="py-2 pr-4">Tarih</th>
                    <th className="py-2 pr-4">Önem</th>
                    <th className="py-2 pr-4">Başlık</th>
                    <th className="py-2">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyItems.map((a) => (
                    <tr
                      key={a.id}
                      className={`border-b border-gray-100 last:border-b-0 ${
                        a.severity === 'CRITICAL' ? 'bg-anomaly-50' : ''
                      }`}
                    >
                      <td className="py-2 pr-4 text-xs text-info-500">
                        {new Date(a.createdAt).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            a.severity === 'CRITICAL'
                              ? 'bg-anomaly-100 text-anomaly-700'
                              : a.severity === 'WARNING'
                                ? 'bg-estimated-100 text-estimated-700'
                                : 'bg-info-100 text-info-700'
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-medium text-gray-900">{a.title}</td>
                      <td className="py-2 text-xs text-info-500 max-w-md truncate" title={a.body ?? ''}>
                        {a.body}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </Layout>
  );
};
