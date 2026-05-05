import React from 'react';
import { Layout } from '../components/common/Layout';
import { RouteOptimizationForm } from '../components/route/RouteOptimizationForm';

export const RouteOptimizationPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rota Optimizasyonu</h1>
        <p className="text-gray-600 mt-2">
          Çoklu araç rota planlaması (CVRP) ile optimize edilmiş toplama rotaları oluşturun
        </p>
      </div>
      <RouteOptimizationForm />
    </Layout>
  );
};
