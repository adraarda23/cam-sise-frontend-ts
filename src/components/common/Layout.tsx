import React from 'react';
import { Navbar } from './Navbar';
import { ChatWidget } from '../chat/ChatWidget';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      {(user?.role === 'CUSTOMER' || user?.role === 'COMPANY_STAFF') && <ChatWidget />}
    </div>
  );
};
