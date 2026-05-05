import React from 'react';
import { Layout } from '../components/common/Layout';
import { VehicleList } from '../components/vehicle/VehicleList';

export const VehiclesPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Araç Yönetimi</h1>
        <p className="text-gray-600 mt-2">
          Sistemdeki tüm araçları görüntüleyin ve yönetin
        </p>
      </div>
      <VehicleList />
    </Layout>
  );
};
