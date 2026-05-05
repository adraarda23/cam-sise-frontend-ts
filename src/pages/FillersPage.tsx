import React from 'react';
import { Layout } from '../components/common/Layout';
import { FillerList } from '../components/filler/FillerList';

export const FillersPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dolumcu Yönetimi</h1>
        <p className="text-gray-600 mt-2">
          Sistemdeki tüm dolumcuları görüntüleyin ve yönetin
        </p>
      </div>
      <FillerList />
    </Layout>
  );
};
