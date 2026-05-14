import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../components/common/Layout';
import { Card } from '../components/common/Card';
import { ActualValue } from '../components/common/ActualValue';
import { EstimatedValue } from '../components/common/EstimatedValue';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { fillerApi } from '../api/fillerApi';
import { useStocksByFiller, useStockForecast } from '../hooks/useStocks';
import { useRequestsByFiller } from '../hooks/useCollectionRequests';
import { ForecastResponse } from '../types/api.types';
import { LineChart, Line, XAxis, YAxis, ReferenceArea, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Bir dolumcunun detay sayfası.
 * - Fiili stok (kesin, ActualValue)
 * - Tahmin: 7 günlük forecast + güven aralığı (EstimatedValue + chart)
 * - ConfidenceBadge ile tahminin güvenilirliği
 * - Son talepler özet listesi
 */
export const FillerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const fillerId = Number(id);

  const fillerQuery = useQuery({
    queryKey: ['filler', fillerId],
    queryFn: () => fillerApi.getById(fillerId),
    enabled: !Number.isNaN(fillerId),
  });

  const stocksQuery = useStocksByFiller(fillerId);
  const palletForecast = useStockForecast(fillerId, 'PALLET', 7);
  const separatorForecast = useStockForecast(fillerId, 'SEPARATOR', 7);
  const requestsQuery = useRequestsByFiller(fillerId);

  const filler = fillerQuery.data;
  const stocks = stocksQuery.data ?? [];
  const palletStock = stocks.find((s) => s.assetType === 'PALLET');
  const separatorStock = stocks.find((s) => s.assetType === 'SEPARATOR');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/fillers" className="text-sm text-indigo-600 hover:text-indigo-800">
              ← Dolumcular
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              {filler?.name ?? `Dolumcu #${id}`}
            </h1>
            {filler && (
              <p className="text-sm text-info-500">
                {filler.address.city} • {filler.contactInfo.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {palletStock && (
            <StockSummaryCard
              title="Palet Stoku"
              currentQty={palletStock.currentQuantity}
              threshold={palletStock.thresholdQuantity}
              forecast={palletForecast.data}
              lossRatePct={palletStock.estimatedLossRate.percentage}
              lossRateStdDev={palletStock.estimatedLossRate.stdDev}
              lossRateSampleSize={palletStock.estimatedLossRate.sampleSize}
            />
          )}
          {separatorStock && (
            <StockSummaryCard
              title="Ayırıcı Stoku"
              currentQty={separatorStock.currentQuantity}
              threshold={separatorStock.thresholdQuantity}
              forecast={separatorForecast.data}
              lossRatePct={separatorStock.estimatedLossRate.percentage}
              lossRateStdDev={separatorStock.estimatedLossRate.stdDev}
              lossRateSampleSize={separatorStock.estimatedLossRate.sampleSize}
            />
          )}
        </div>

        {palletForecast.data && palletStock && (
          <Card title="Palet — 7 Gün Tahmin (Güven Aralığı)">
            <ForecastChart
              currentQty={palletStock.currentQuantity}
              forecast={palletForecast.data}
              threshold={palletStock.thresholdQuantity}
            />
          </Card>
        )}

        <Card title="Son Talepler">
          {requestsQuery.isLoading && <p className="text-sm text-gray-500">Yükleniyor...</p>}
          {!requestsQuery.isLoading && (requestsQuery.data?.length ?? 0) === 0 && (
            <p className="text-sm text-gray-500">Talep yok</p>
          )}
          {!requestsQuery.isLoading && (requestsQuery.data?.length ?? 0) > 0 && (
            <div className="divide-y divide-gray-100">
              {requestsQuery.data!.slice(0, 10).map((r) => (
                <div key={r.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-900">
                      {r.assetType === 'PALLET' ? 'Palet' : 'Ayırıcı'}
                    </span>
                    <span className="ml-2 text-info-500">#{r.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-estimated-700 italic">~{r.estimatedQuantity} adet</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-info-100 text-info-700">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

interface StockSummaryCardProps {
  title: string;
  currentQty: number;
  threshold: number;
  forecast?: ForecastResponse;
  lossRatePct: number;
  lossRateStdDev?: number;
  lossRateSampleSize?: number;
}

const StockSummaryCard: React.FC<StockSummaryCardProps> = ({
  title,
  currentQty,
  threshold,
  forecast,
  lossRatePct,
  lossRateStdDev,
  lossRateSampleSize,
}) => {
  return (
    <Card title={title}>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-info-500">Fiili Stok (gerçekleşmiş)</p>
          <ActualValue value={currentQty} size="xl" unit="adet" />
        </div>

        {forecast && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-info-500">7 gün sonra tahmini stok</p>
              <ConfidenceBadge relativeUncertainty={computeRelative(forecast)} />
            </div>
            <EstimatedValue
              value={forecast.mean}
              stdDev={forecast.stdDev}
              sampleSize={forecast.sampleSize}
              lowerBound={forecast.lowerBound}
              upperBound={forecast.upperBound}
              unit="adet"
              size="xl"
            />
          </div>
        )}

        <div className="text-xs text-info-500">
          Eşik: <span className="font-medium text-info-700">{threshold}</span> •{' '}
          Kayıp oranı:{' '}
          <EstimatedValue
            value={lossRatePct}
            stdDev={lossRateStdDev}
            sampleSize={lossRateSampleSize}
            unit="%"
            size="sm"
            showRange={Boolean(lossRateStdDev && lossRateStdDev > 0)}
            precision={1}
          />
        </div>

        {forecast?.daysUntilThreshold != null && forecast.daysUntilThreshold > 0 && (
          <div className="text-xs px-2 py-1 rounded bg-estimated-50 text-estimated-700 inline-block">
            ⏱️ Tahmini eşiğe ulaşma: {forecast.daysUntilThreshold} gün
          </div>
        )}
      </div>
    </Card>
  );
};

function computeRelative(f: ForecastResponse): number {
  if (Math.abs(f.mean) < 0.01) return f.stdDev > 0 ? 1 : 0;
  const margin = 1.96 * f.stdDev / Math.sqrt(Math.max(1, f.sampleSize));
  return margin / Math.abs(f.mean);
}

interface ForecastChartProps {
  currentQty: number;
  forecast: ForecastResponse;
  threshold: number;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ currentQty, forecast, threshold }) => {
  // Simple linear interpolation between current quantity (day 0) and forecast.mean (day 7)
  const dailyDelta = (forecast.mean - currentQty) / 7;
  const sigmaPerDay = forecast.stdDev / Math.sqrt(7);

  const data = Array.from({ length: 8 }, (_, i) => {
    const day = i;
    const mean = currentQty + dailyDelta * day;
    const localSigma = sigmaPerDay * Math.sqrt(day);
    return {
      day: `T+${day}`,
      mean,
      lower: mean - 1.96 * localSigma,
      upper: mean + 1.96 * localSigma,
      threshold,
    };
  });

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <ReferenceArea
            y1={data[data.length - 1].lower}
            y2={data[data.length - 1].upper}
            ifOverflow="extendDomain"
            fill="#fde68a"
            fillOpacity={0.25}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="mean"
            name="Tahmin"
            stroke="#b45309"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="upper"
            name="Üst sınır (95%)"
            stroke="#f59e0b"
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="lower"
            name="Alt sınır (95%)"
            stroke="#f59e0b"
            strokeDasharray="4 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="threshold"
            name="Eşik"
            stroke="#dc2626"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
