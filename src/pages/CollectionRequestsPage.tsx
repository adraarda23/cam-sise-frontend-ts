import React from 'react';
import { Layout } from '../components/common/Layout';
import { RequestList } from '../components/request/RequestList';

export const CollectionRequestsPage: React.FC = () => {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Toplama Talepleri</h1>
        <p className="text-gray-600 mt-2">
          Dolumculardan gelen toplama taleplerini onaylayın veya reddedin
        </p>
      </div>
      <RequestList />
    </Layout>
  );
};
