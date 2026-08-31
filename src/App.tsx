import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { LoginPage } from './pages/Login';
import { store } from './services/store';

export default function App() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean>(store.isAuthenticated());
  const [role, setRole] = useState(store.getAdminRole());

  useEffect(() => {
    const handleStoreChange = () => {
      setAuthenticated(store.isAuthenticated());
      setRole(store.getAdminRole());
    };
    const unsub = store.subscribe(handleStoreChange);
    return unsub;
  }, []);

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen-d bg-slate-950 text-slate-100 flex flex-col">
      {!isLoginPage && <AdminNavbar />}
      {/* The login screen owns its own full-bleed centred layout, so it opts out
          of the shell gutters; every other route gets the fluid container. */}
      <main
        className={
          isLoginPage
            ? 'flex-1 w-full'
            : 'flex-1 w-full container-fluid py-fluid-4'
        }
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              !authenticated ? (
                <Navigate to="/login" replace />
              ) : role === 'TREASURER' ? (
                <Navigate to="/payments" replace />
              ) : (
                <AdminDashboard />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={authenticated ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/payments" 
            element={authenticated ? <PaymentVerification /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/entry" 
            element={authenticated ? <EntryCheckin /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/events" 
            element={authenticated ? <EventCheckin /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/food" 
            element={authenticated ? <FoodCheckin /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/participants" 
            element={authenticated ? <ParticipantsList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/scanner" 
            element={authenticated ? <QRScannerPage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/certificates" 
            element={authenticated ? <CertificateAdmin /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/reports" 
            element={authenticated ? <ReportsExport /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
