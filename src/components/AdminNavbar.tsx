import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ShieldCheck,
  LogOut,
  Coins
} from 'lucide-react';

export const AdminNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<AdminRole>(store.getAdminRole());
  const [authUser, setAuthUser] = useState<any>(store.getAuthUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleStoreChange = () => {
      setRole(store.getAdminRole());
      setAuthUser(store.getAuthUser());
    };
    const unsub = store.subscribe(handleStoreChange);
    return unsub;
  }, []);

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    store.setAdminRole(newRole);
  };

  const handleLogout = () => {
    store.logoutAdmin();
    navigate('/login');
  };

  // Rendered by both the desktop pill and the mobile drawer row so the two
  // switchers can never drift apart.
  const roleOptions: { value: AdminRole; label: string; optionClass: string }[] = [
    { value: 'TREASURER', label: 'TREASURER (Payment Verification)', optionClass: 'bg-slate-900 text-emerald-300' },
    { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN (Full Control)', optionClass: 'bg-slate-900 text-white' },
    { value: 'ENTRY_STAFF', label: 'ENTRY_STAFF (Gate Entry)', optionClass: 'bg-slate-900 text-white' },
    { value: 'FOOD_STAFF', label: 'FOOD_STAFF (Food Token)', optionClass: 'bg-slate-900 text-white' },
    { value: 'EVENT_ADMIN', label: 'EVENT_ADMIN (Events)', optionClass: 'bg-slate-900 text-white' },
    { value: 'CERTIFICATE_ADMIN', label: 'CERTIFICATE_ADMIN (Certs)', optionClass: 'bg-slate-900 text-white' },
  ];

  const navItems = [
    { 
      name: 'Payments', 
      path: '/payments', 
      aliasPaths: [],
      icon: CreditCard, 
      roles: ['SUPER_ADMIN', 'TREASURER'] 
    },
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      aliasPaths: ['/'],
      icon: LayoutDashboard, 
      roles: ['SUPER_ADMIN', 'TREASURER', 'EVENT_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'CERTIFICATE_ADMIN'] 
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

  const RoleIcon = role === 'TREASURER' ? Coins : ShieldCheck;

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="container-fluid">
        {/* Phone header carries only the compact logo + hamburger; the role
            switcher and Sign Out live in the drawer below `lg`. */}
        <div className="flex items-center justify-between gap-fluid-2 min-h-touch py-fluid-2 lg:h-16 lg:py-0">

          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-fluid-2 group min-w-0 flex-1 lg:flex-initial">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-fluid bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0">
              {/* Wraps rather than clipping: at 320px the wide "TREASURER
                  PORTAL" badge drops to its own line instead of eating the
                  brand name. */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-extrabold text-white tracking-wider text-base font-mono truncate">ZINNIA 2026</span>
                <span className={`shrink-0 text-2xs font-mono px-2 py-0.5 rounded-full border font-bold whitespace-nowrap ${
                  role === 'TREASURER'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                }`}>
                  {role === 'TREASURER' ? 'TREASURER PORTAL' : 'ADMIN'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                {authUser?.name ? `${authUser.name}` : 'Command & Operations Center'}
              </p>
            </div>
          </Link>

          {/* Desktop Role Switcher & Sign Out */}
          <div className="flex items-center gap-fluid-2 shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 rounded-fluid min-h-touch w-[15rem] xl:w-[17rem]">
              <RoleIcon className={`w-4 h-4 shrink-0 ${role === 'TREASURER' ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">ROLE:</span>
              <select
                aria-label="Admin role"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                className="flex-1 min-w-0 w-full min-h-touch bg-transparent border-none text-indigo-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className={opt.optionClass}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden lg:flex px-3 min-h-touch items-center gap-1.5 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 rounded-fluid text-xs font-mono transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden tap inline-flex items-center justify-center rounded-fluid text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex flex-nowrap items-center gap-1 py-2 overflow-x-auto border-t border-slate-900 scrollbar-none">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.aliasPaths);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-mono text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
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
          <div className="lg:hidden border-t border-slate-900 max-h-[70dvh] overflow-y-auto scrollbar-none scroll-touch">
            <div className="py-fluid-3 space-y-1 font-mono text-xs pb-safe">

              {/* Role switcher — relocated out of the cramped phone header */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-fluid-3 rounded-fluid min-h-touch">
                <RoleIcon className={`w-4 h-4 shrink-0 ${role === 'TREASURER' ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span className="text-xs font-mono text-slate-400 font-semibold shrink-0">ROLE:</span>
                <select
                  aria-label="Admin role"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                  className="flex-1 min-w-0 w-full min-h-touch bg-transparent border-none text-indigo-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className={opt.optionClass}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {allowedNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.aliasPaths);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-fluid-3 min-h-touch rounded-fluid flex items-center gap-3 font-semibold transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}

              {/* Sign Out — relocated out of the cramped phone header */}
              <button
                onClick={handleLogout}
                className="w-full px-fluid-3 min-h-touch bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 rounded-fluid flex items-center gap-3 font-semibold transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
