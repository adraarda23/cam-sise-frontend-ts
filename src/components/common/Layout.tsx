import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { StaffSidebar } from './StaffSidebar';
import { ChatWidget } from '../chat/ChatWidget';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isStaff = user?.role === 'COMPANY_STAFF';
  const showChat = user?.role === 'CUSTOMER' || user?.role === 'COMPANY_STAFF';

  if (isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <StaffSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar
            onOpenSidebar={() => setSidebarOpen(true)}
            insideStaffLayout
          />
          <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          {showChat && <ChatWidget />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      {showChat && <ChatWidget />}
    </div>
  );
};
