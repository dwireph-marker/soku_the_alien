import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Heart, Sparkles, Sun, Smile, Music, Film, Star, Coffee, Home, Flame, MessageCircle, Infinity } from 'lucide-react';
import { ReasonItem } from '../../types';
import { ConfirmModal } from '../components/ConfirmModal';

interface LoveReasonsPageProps {
  reasons: ReasonItem[];
  onAddReason: (reason: { text: string; icon: string }) => Promise<void>;
  onEditReason: (id: string, updates: Partial<ReasonItem>) => Promise<void>;
  onDeleteReason: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoveReasonsPage: React.FC<LoveReasonsPageProps> = ({
  reasons,
  onAddReason,
  onEditReason,
  onDeleteReason,
  showToast
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReasonItem | null>(null);
  const [reasonToDelete, setReasonToDelete] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [icon, setIcon] = useState('Sparkles');

  const iconOptions = ['Sparkles', 'HeartHandshake', 'Sun', 'Smile', 'Music', 'Film', 'Star', 'Coffee', 'Home', 'Flame', 'MessageCircle', 'Infinity'];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await onAddReason({ text: text.trim(), icon });
      showToast('Love reason added!', 'success');
      setText('');
      setIsAddOpen(false);
    } catch (err) {
      showToast('Failed to add reason.', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReason || !text.trim()) return;
    try {
      await onEditReason(editingReason.id, { text: text.trim(), icon });
      showToast('Reason updated!', 'success');
      setEditingReason(null);
      setText('');
    } catch (err) {
      showToast('Failed to edit reason.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-100">Reasons Why I Love You</h1>
          <p className="text-xs text-stone-400">Manage love cards displayed in the interactive deck section</p>
        </div>
        <button
          onClick={() => { setText(''); setIcon('Sparkles'); setIsAddOpen(true); }}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Love Reason</span>
        </button>
      </div>

      {!reasons || reasons.length === 0 ? (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-3xl p-12 text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-100 mb-1">No love reasons found</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto mb-6">
            Click "Add Love Reason" to create your first love card for the deck.
          </p>
          <button
            onClick={() => { setText(''); setIcon('Sparkles'); setIsAddOpen(true); }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Love Reason</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(reasons || []).map((reason) => (
            <div key={reason.id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                  Reason #{reason.number}
                </span>
                <span className="text-xs text-stone-400 font-mono">Icon: {reason.icon}</span>
              </div>

              <p className="text-xs text-stone-200 leading-relaxed font-medium italic">
                "{reason.text}"
              </p>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingReason(reason);
                    setText(reason.text);
                    setIcon(reason.icon);
                  }}
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setReasonToDelete(reason.id)}
                  className="p-2 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 text-xs border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(isAddOpen || editingReason) && (
        <div className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-stone-100">
              {editingReason ? 'Edit Love Reason' : 'Add New Love Reason'}
            </h2>

            <form onSubmit={editingReason ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Reason Text</label>
                <textarea
                  rows={4}
                  required
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="The sweet way you smile when..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Select Icon</label>
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-100"
                >
                  {iconOptions.map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingReason(null); }}
                  className="px-4 py-2 rounded-xl text-xs bg-stone-800 text-stone-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs bg-amber-500 text-stone-950 font-bold"
                >
                  {editingReason ? 'Save' : 'Add Reason'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(reasonToDelete)}
        title="Delete Love Reason"
        message="Are you sure you want to delete this reason card?"
        onConfirm={async () => {
          if (reasonToDelete) {
            await onDeleteReason(reasonToDelete);
            showToast('Reason card deleted.', 'info');
            setReasonToDelete(null);
          }
        }}
        onClose={() => setReasonToDelete(null)}
      />
    </div>
  );
};
