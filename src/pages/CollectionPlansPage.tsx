import React from 'react';
import { Layout } from '../components/common/Layout';
import { PlanList } from '../components/route/PlanList';

export const CollectionPlansPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Toplama Planları</h1>
        <p className="text-gray-600 mt-2">
          Oluşturulan toplama planlarını görüntüleyin ve yönetin
        </p>
      </div>
      <PlanList />
    </Layout>
  );
};
