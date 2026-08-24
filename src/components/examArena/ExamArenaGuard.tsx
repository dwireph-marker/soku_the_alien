import React from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { AdminLogin } from '../../admin/AdminLogin';
import { ExamArenaMainView } from './ExamArenaMainView';
import { Loader2, Shield } from 'lucide-react';

interface ExamArenaGuardProps {
  initialModal?: string | null;
  onClose: () => void;
}

export const ExamArenaGuard: React.FC<ExamArenaGuardProps> = ({ initialModal, onClose }) => {
  const { user, email, isAuthenticated, authInitializing, logout } = useAdminAuth();

  if (authInitializing) {
    return (
      <div className="fixed inset-0 z-[550] bg-[#050713] flex flex-col items-center justify-center p-4 text-cyan-400 font-mono select-none">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-[#090d1e] border border-cyan-500/30 shadow-2xl">
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
            <Shield className="w-4 h-4 text-cyan-300 absolute" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold tracking-wider text-white">VERIFYING EXAM ARENA ACCESS</p>
            <p className="text-xs text-stone-400">Verifying administrator authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          // Auth listener in useAdminAuth updates automatically
        }}
        onNavigateHome={onClose}
      />
    );
  }

  return (
    <ExamArenaMainView
      initialModal={initialModal}
      userEmail={email || user.email || 'Admin'}
      onLogout={async () => {
        await logout();
      }}
      onClose={onClose}
    />
  );
};

