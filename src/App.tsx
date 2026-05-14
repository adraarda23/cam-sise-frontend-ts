import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ConfirmDialogProvider } from './components/common/ConfirmDialog';
import { InputDialogProvider } from './components/common/InputDialog';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RouteOptimizationPage } from './pages/RouteOptimizationPage';
import { CollectionRequestsPage } from './pages/CollectionRequestsPage';
import { FillersPage } from './pages/FillersPage';
import { StocksPage } from './pages/StocksPage';
import { CollectionPlansPage } from './pages/CollectionPlansPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { FillerDetailPage } from './pages/FillerDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmDialogProvider>
        <InputDialogProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Dashboard - all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin-only Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>

            {/* Operational Routes - COMPANY_STAFF only */}
            <Route element={<ProtectedRoute allowedRoles={['COMPANY_STAFF']} />}>
              <Route path="/routes" element={<RouteOptimizationPage />} />
              <Route path="/requests" element={<CollectionRequestsPage />} />
              <Route path="/fillers" element={<FillersPage />} />
              <Route path="/fillers/:id" element={<FillerDetailPage />} />
              <Route path="/stocks" element={<StocksPage />} />
              <Route path="/plans" element={<CollectionPlansPage />} />
              <Route path="/vehicles" element={<VehiclesPage />} />
              <Route path="/customers" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
              <Route path="/my-requests" element={<MyRequestsPage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        </InputDialogProvider>
        </ConfirmDialogProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
