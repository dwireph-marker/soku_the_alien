import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Ticket, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { VoucherItem } from '../../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface VouchersPageProps {
  vouchers: VoucherItem[];
  onAddVoucher: (voucher: Partial<VoucherItem>) => Promise<void>;
  onEditVoucher: (id: string, updates: Partial<VoucherItem>) => Promise<void>;
  onResetVoucher: (id: string) => Promise<void>;
  onDeleteVoucher: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VouchersPage: React.FC<VouchersPageProps> = ({
  vouchers,
  onAddVoucher,
  onEditVoucher,
  onResetVoucher,
  onDeleteVoucher,
  showToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Romantic');
  const [icon, setIcon] = useState('UtensilsCrossed');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    try {
      await onAddVoucher({
        title: title.trim(),
        description: description.trim(),
        code: code.trim() || 'LOVE-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        category,
        icon
      });
      showToast('Love Voucher created!', 'success');
      setTitle(''); setDescription(''); setCode('');
      setIsAddOpen(false);
    } catch (err) {
      showToast('Failed to create voucher.', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoucher) return;
    try {
      await onEditVoucher(editingVoucher.id, {
        title: title.trim(),
        description: description.trim(),
        code: code.trim(),
        category,
        icon
      });
      showToast('Voucher updated!', 'success');
      setEditingVoucher(null);
    } catch (err) {
      showToast('Failed to update voucher.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100">Love Vouchers Manager</h1>
          <p className="text-xs text-stone-400">Manage redeemable love tickets, codes, categories, and redemption status</p>
        </div>
        <button
          onClick={() => { setTitle(''); setDescription(''); setCode(''); setIsAddOpen(true); }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create Voucher</span>
        </button>
      </div>

      {!vouchers || vouchers.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-3xl p-12 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-100 mb-1">No love vouchers found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mb-6">
            Click "Create Voucher" to create a new love voucher.
          </p>
          <button
            onClick={() => { setTitle(''); setDescription(''); setCode(''); setIsAddOpen(true); }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Voucher</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(vouchers || []).map((voucher) => (
            <div key={voucher.id} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 relative overflow-hidden">
              {voucher.isRedeemed && (
                <div className="absolute top-0 right-0 bg-rose-500/20 text-rose-300 border-l border-b border-rose-500/30 px-3 py-1 rounded-bl-2xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-rose-400" />
                  <span>Redeemed</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{voucher.category || 'Special Ticket'}</span>
                </div>
                <h3 className="font-bold text-base text-stone-100">{voucher.title}</h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">{voucher.description}</p>
                <div className="mt-3 inline-block px-3 py-1 bg-stone-950 border border-stone-800 rounded-lg text-xs font-mono text-amber-300">
                  Code: {voucher.code}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                {voucher.isRedeemed ? (
                  <button
                    onClick={async () => {
                      await onResetVoucher(voucher.id);
                      showToast('Voucher redemption reset!', 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 text-xs border border-emerald-500/30 flex items-center gap-1"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    <span>Reset Redemption</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-stone-500 italic">Available to redeem</span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingVoucher(voucher);
                      setTitle(voucher.title);
                      setDescription(voucher.description);
                      setCode(voucher.code);
                      setCategory(voucher.category || 'Romantic');
                      setIcon(voucher.icon || 'UtensilsCrossed');
                    }}
                    className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setVoucherToDelete(voucher.id)}
                    className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-xs border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {(isAddOpen || editingVoucher) && (
        <div className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-100">
              {editingVoucher ? 'Edit Love Voucher' : 'Create Love Voucher'}
            </h2>

            <form onSubmit={editingVoucher ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Romantic Candlelight Dinner Date"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Redeemable for a home-cooked gourmet dinner..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Voucher Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="LOVE-DINNER-01"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Romantic"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingVoucher(null); }}
                  className="px-4 py-2 rounded-xl text-xs bg-stone-800 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs bg-amber-500 text-stone-950 font-bold"
                >
                  {editingVoucher ? 'Save Changes' : 'Create Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(voucherToDelete)}
        title="Delete Voucher"
        message="Are you sure you want to delete this voucher?"
        onConfirm={async () => {
          if (voucherToDelete) {
            await onDeleteVoucher(voucherToDelete);
            showToast('Voucher deleted.', 'info');
            setVoucherToDelete(null);
          }
        }}
        onClose={() => setVoucherToDelete(null)}
      />
    </div>
  );
};
