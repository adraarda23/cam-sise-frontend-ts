import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Dashboard - all authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
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
    </AuthProvider>
  );
}

export default App;
