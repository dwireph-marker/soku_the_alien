import React, { useState } from 'react';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { AdminSkeleton } from './components/AdminSkeleton';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { DashboardPage } from './pages/DashboardPage';
import { NamesPage } from './pages/NamesPage';
import { BirthdayDateTimePage } from './pages/BirthdayDateTimePage';
import { SiteSettingsPage } from './pages/SiteSettingsPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { LoveReasonsPage } from './pages/LoveReasonsPage';
import { VouchersPage } from './pages/VouchersPage';
import { MusicPage } from './pages/MusicPage';
import { CelebrationPage } from './pages/CelebrationPage';
import { WishesPage } from './pages/WishesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ExamArenaAdminPage } from './pages/ExamArenaAdminPage';

import { useAdminState } from './hooks/useAdminState';

interface AdminAppProps {
  onNavigateHome: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const state = useAdminState();

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const openConfirm = (opts: { title: string; message: string; onConfirm: () => void }) => {
    setConfirmModal({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      onConfirm: opts.onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  if (state.authInitializing) {
    return <AdminSkeleton />;
  }

  if (!state.token) {
    return (
      <AdminLogin
        onLoginSuccess={(u) => {
          state.handleLoginSuccess(u);
          showToast('Welcome back to Admin Portal!', 'success');
        }}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (state.loading || !state.config) {
    return <AdminSkeleton />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            config={state.config!}
            memories={state.memories}
            reasons={state.reasons}
            vouchers={state.vouchers}
            wishes={state.wishes}
            auditLogs={state.auditLogs}
            onSelectTab={setActiveTab}
            onRefresh={state.fetchAllData}
          />
        );
      case 'names':
      case 'settings':
        return (
          <SiteSettingsPage
            config={state.config}
            onSave={state.handleSaveSettings}
            onSaveNames={state.handleSaveNames}
            onReset={state.fetchAllData}
            showToast={showToast}
            initialSubTab="names"
          />
        );
      case 'birthday':
        return (
          <BirthdayDateTimePage
            config={state.config}
            onSaveBirthday={state.handleSaveBirthday}
            showToast={showToast}
          />
        );
      case 'exam-arena':
        return (
          <ExamArenaAdminPage
            showToast={showToast}
            openConfirm={(title, msg, onConfirm) => openConfirm({ title, message: msg, onConfirm })}
          />
        );
      case 'memories':
        return (
          <MemoriesPage
            photos={state.memories}
            onAddPhoto={state.handleAddMemory}
            onEditPhoto={state.handleUpdateMemory}
            onDeletePhoto={state.handleDeleteMemory}
            showToast={showToast}
          />
        );
      case 'reasons':
        return (
          <LoveReasonsPage
            reasons={state.reasons}
            onAddReason={async (r) => state.handleAddReason({ text: r.text, icon: r.icon })}
            onEditReason={state.handleUpdateReason}
            onDeleteReason={state.handleDeleteReason}
            showToast={showToast}
          />
        );
      case 'vouchers':
        return (
          <VouchersPage
            vouchers={state.vouchers}
            onAddVoucher={state.handleAddVoucher}
            onEditVoucher={state.handleUpdateVoucher}
            onResetVoucher={async (id) => state.handleUpdateVoucher(id, { isRedeemed: false })}
            onDeleteVoucher={state.handleDeleteVoucher}
            showToast={showToast}
          />
        );
      case 'music':
        return (
          <MusicPage
            config={state.config}
            onSaveMusic={state.handleSaveMusic}
            showToast={showToast}
          />
        );
      case 'celebration':
        return (
          <CelebrationPage
            config={state.config}
            onSaveCelebration={state.handleSaveCelebration}
            showToast={showToast}
          />
        );
      case 'wishes':
        return (
          <WishesPage
            wishes={state.wishes}
            onDeleteWish={state.handleDeleteWish}
            showToast={showToast}
            openConfirm={openConfirm}
          />
        );
      case 'audit-logs':
        return (
          <AuditLogsPage
            logs={state.auditLogs}
            showToast={showToast}
            openConfirm={openConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout
      user={{ email: state.userEmail, token: state.token || '', uid: state.userEmail, isAdmin: true }}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onLogout={async () => {
        await state.handleLogout();
        showToast('Signed out safely', 'success');
      }}
      onNavigateHome={onNavigateHome}
    >
      <ErrorBoundary fallbackName="Admin Page View">
        {renderActivePage()}
      </ErrorBoundary>

      {toast && (
        <ErrorBoundary fallbackName="Notification Toast">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </ErrorBoundary>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={closeConfirm}
        onConfirm={() => {
          confirmModal.onConfirm();
          closeConfirm();
        }}
      />
    </AdminLayout>
  );
};
