import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinQueuePage } from './pages/customer/JoinQueuePage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { HistoryPage } from './pages/customer/HistoryPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { CounterManagementPage } from './pages/staff/CounterManagementPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { ServicesPage } from './pages/admin/ServicesPage';
import { CountersPage } from './pages/admin/CountersPage';
import { UsersPage } from './pages/admin/UsersPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { QRCodeManagementPage } from './pages/admin/QRCodeManagementPage';
import { PublicDisplayPage } from './pages/PublicDisplayPage';
import { QRJoinPage } from './pages/customer/QRJoinPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              {/* Direct Full-Screen & Mobile QR Scan Routes */}
              <Route path="/display" element={<PublicDisplayPage />} />
              <Route path="/display/:orgId" element={<PublicDisplayPage />} />
              <Route path="/join/:organizationId/:serviceId" element={<QRJoinPage />} />
              <Route path="/join/:organizationId" element={<QRJoinPage />} />
              <Route path="/q/:organizationId/:serviceId" element={<QRJoinPage />} />
              <Route path="/q/:organizationId" element={<QRJoinPage />} />

              {/* Public Routes with MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/customer/join" element={<JoinQueuePage />} />
              </Route>

              {/* Customer Routes with DashboardLayout */}
              <Route path="/customer" element={<DashboardLayout requiredRole="customer" />}>
                <Route path="dashboard" element={<CustomerDashboard />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="join" element={<JoinQueuePage />} />
              </Route>

              {/* Staff Routes with DashboardLayout */}
              <Route path="/staff" element={<DashboardLayout requiredRole="staff" />}>
                <Route path="dashboard" element={<StaffDashboard />} />
                <Route path="counters" element={<CounterManagementPage />} />
              </Route>

              {/* Admin Routes with DashboardLayout */}
              <Route path="/admin" element={<DashboardLayout requiredRole="admin" />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="qr-codes" element={<QRCodeManagementPage />} />
                <Route path="organizations" element={<OrganizationsPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="counters" element={<CountersPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
