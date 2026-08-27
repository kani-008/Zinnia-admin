import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { store } from '../services/store';
import { AdminRole } from '@packages/types/src';
import { 
  Zap, 
  LayoutDashboard, 
  QrCode, 
  DoorOpen, 
  Utensils, 
  Award, 
  Users, 
  FileSpreadsheet,
  CreditCard,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const AdminNavbar: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState<AdminRole>(store.getAdminRole());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleStoreChange = () => {
      setRole(store.getAdminRole());
    };
    const unsub = store.subscribe(handleStoreChange);
    return unsub;
  }, []);

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    store.setAdminRole(newRole);
  };

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      aliasPaths: ['/'],
      icon: LayoutDashboard, 
      roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'CERTIFICATE_ADMIN'] 
    },
    { 
      name: 'Payments', 
      path: '/payments', 
      aliasPaths: [],
      icon: CreditCard, 
      roles: ['SUPER_ADMIN'] 
    },
    { 
      name: 'Gate Entry', 
      path: '/entry', 
      aliasPaths: [],
      icon: DoorOpen, 
      roles: ['SUPER_ADMIN', 'ENTRY_STAFF'] 
    },
    { 
      name: 'Food Counter', 
      path: '/food', 
      aliasPaths: [],
      icon: Utensils, 
      roles: ['SUPER_ADMIN', 'FOOD_STAFF'] 
    },
    { 
      name: 'Event Checkin', 
      path: '/events', 
      aliasPaths: [],
      icon: Zap, 
      roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] 
    },
    { 
      name: 'Participants', 
      path: '/participants', 
      aliasPaths: [],
      icon: Users, 
      roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] 
    },
    { 
      name: 'QR Scanner', 
      path: '/scanner', 
      aliasPaths: [],
      icon: QrCode, 
      roles: ['SUPER_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'EVENT_ADMIN'] 
    },
    { 
      name: 'Certificates', 
      path: '/certificates', 
      aliasPaths: [],
      icon: Award, 
      roles: ['SUPER_ADMIN', 'CERTIFICATE_ADMIN'] 
    },
    { 
      name: 'Excel Reports', 
      path: '/reports', 
      aliasPaths: [],
      icon: FileSpreadsheet, 
      roles: ['SUPER_ADMIN'] 
    }
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  const isActive = (itemPath: string, aliases: string[]) => {
    if (location.pathname === itemPath) return true;
    if (aliases.includes(location.pathname)) return true;
    return false;
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white tracking-wider text-base">ZINNIA 2026</span>
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">ADMIN</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">Command & Operations Center</p>
            </div>
          </Link>

          {/* Desktop Role Switcher & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-400 font-semibold hidden md:inline">ROLE:</span>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                className="bg-transparent border-none text-indigo-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="SUPER_ADMIN" className="bg-slate-900 text-white">SUPER_ADMIN (Full Control)</option>
                <option value="ENTRY_STAFF" className="bg-slate-900 text-white">ENTRY_STAFF (Gate Entry)</option>
                <option value="FOOD_STAFF" className="bg-slate-900 text-white">FOOD_STAFF (Food Token)</option>
                <option value="EVENT_ADMIN" className="bg-slate-900 text-white">EVENT_ADMIN (Events)</option>
                <option value="CERTIFICATE_ADMIN" className="bg-slate-900 text-white">CERTIFICATE_ADMIN (Certs)</option>
              </select>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-900 scrollbar-none">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.aliasPaths);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-900 space-y-1 font-mono text-xs">
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.aliasPaths);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-3 font-semibold transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
