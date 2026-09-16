import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { NodesPage } from './pages/NodesPage';
import { DataTrendsPage } from './pages/DataTrendsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import './App.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dedicated Landing Page - Spacious, comfortable, and organized */}
        <Route path="/" element={<LandingPage />} />

        {/* Operational Control-Room Console Shell */}
        <Route
          path="/*"
          element={
            <AppShell>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/live-map" element={<LiveMapPage />} />
                <Route path="/nodes" element={<NodesPage />} />
                <Route path="/data-trends" element={<DataTrendsPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

