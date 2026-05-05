import React from 'react';
import { Layout } from '../components/common/Layout';
import { StockOverview } from '../components/stock/StockOverview';

export const StocksPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Stok Yönetimi</h1>
        <p className="text-gray-600 mt-2">
          Tüm dolumcuların stok durumunu görüntüleyin ve yönetin
        </p>
      </div>
      <StockOverview />
    </Layout>
  );
};
