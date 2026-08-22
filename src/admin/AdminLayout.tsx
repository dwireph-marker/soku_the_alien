import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarClock,
  Settings,
  Image as ImageIcon,
  Heart,
  Ticket,
  Music,
  PartyPopper,
  Sparkles,
  History,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  UserCheck,
  Compass,
  GraduationCap
} from 'lucide-react';
import { AdminUser } from '../types';

export type AdminTab =
  | 'dashboard'
  | 'names'
  | 'birthday'
  | 'settings'
  | 'exam-arena'
  | 'memories'
  | 'reasons'
  | 'vouchers'
  | 'music'
  | 'celebration'
  | 'wishes'
  | 'audit-logs';

interface AdminLayoutProps {
  user: AdminUser;
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  user,
  activeTab,
  onSelectTab,
  onLogout,
  onNavigateHome,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'exam-arena', label: '🎓 Exam Arena Manager', icon: GraduationCap },
    { id: 'settings', label: '👤 Names & Site Settings', icon: UserCheck },
    { id: 'birthday', label: '🎂 Birthday Date & Time', icon: CalendarClock },
    { id: 'memories', label: 'Memory Gallery', icon: ImageIcon },
    { id: 'reasons', label: 'Love Reasons', icon: Heart },
    { id: 'vouchers', label: 'Love Vouchers', icon: Ticket },
    { id: 'music', label: 'Audio & Music', icon: Music },
    { id: 'celebration', label: 'Cake & Candles', icon: PartyPopper },
    { id: 'wishes', label: 'Her Wishes', icon: Sparkles },
    { id: 'audit-logs', label: 'Audit Logs', icon: History }
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-900 border-r border-stone-800 shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-stone-100">Admin Portal</h1>
              <p className="text-[10px] text-stone-400">Romantic Site Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as AdminTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-800 space-y-2">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-stone-300 bg-stone-800/80 hover:bg-stone-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              <span>Live Website</span>
            </span>
            <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded">View</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-stone-900/90 border-b border-stone-800 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-400 hover:text-stone-200 rounded-xl bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-semibold text-stone-200 capitalize">
              {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs text-stone-400">
              Logged in as <strong className="text-stone-200 font-medium">{user.email}</strong>
            </span>
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview App</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-stone-900 border-b border-stone-800 p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs ${
                    activeTab === item.id
                      ? 'bg-amber-500/10 text-amber-300 font-medium'
                      : 'text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
