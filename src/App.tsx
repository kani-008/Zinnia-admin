import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminDashboardPage as AdminDashboard } from './pages/AdminDashboard';
import { EntryCheckinPage as EntryCheckin } from './pages/EntryCheckin';
import { EventCheckinPage as EventCheckin } from './pages/EventCheckin';
import { FoodCheckinPage as FoodCheckin } from './pages/FoodCheckin';
import { PaymentVerificationPage as PaymentVerification } from './pages/PaymentVerification';
import { ParticipantsListPage as ParticipantsList } from './pages/ParticipantsList';
import { QRScannerPage } from './pages/QRScanner';
import { CertificateAdminPage as CertificateAdmin } from './pages/CertificateAdmin';
import { ReportsExportPage as ReportsExport } from './pages/ReportsExport';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/entry" element={<EntryCheckin />} />
          <Route path="/events" element={<EventCheckin />} />
          <Route path="/food" element={<FoodCheckin />} />
          <Route path="/payments" element={<PaymentVerification />} />
          <Route path="/participants" element={<ParticipantsList />} />
          <Route path="/scanner" element={<QRScannerPage />} />
          <Route path="/certificates" element={<CertificateAdmin />} />
          <Route path="/reports" element={<ReportsExport />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
