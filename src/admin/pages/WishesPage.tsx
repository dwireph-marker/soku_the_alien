import React, { useState } from 'react';
import { Search, Trash2, Heart, Sparkles, Calendar, MessageCircle, User } from 'lucide-react';
import { Wish } from '../../types';

interface WishesPageProps {
  wishes: Wish[];
  onDeleteWish: (id: string) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  openConfirm: (opts: { title: string; message: string; onConfirm: () => void }) => void;
}

export const WishesPage: React.FC<WishesPageProps> = ({
  wishes = [],
  onDeleteWish,
  showToast,
  openConfirm
}) => {
  const [search, setSearch] = useState('');

  const filteredWishes = wishes.filter(w => {
    const term = search.toLowerCase();
    const wishName = w.name || w.herName || 'Sonali';
    const wishMessage = w.message || w.wishText || '';
    return (
      wishName.toLowerCase().includes(term) ||
      wishMessage.toLowerCase().includes(term)
    );
  });

  const handleDelete = (wish: Wish) => {
    const displayName = wish.name || wish.herName || 'Sonali';
    openConfirm({
      title: 'Delete Birthday Wish',
      message: `Are you sure you want to delete the wish from "${displayName}"?`,
      onConfirm: async () => {
        try {
          await onDeleteWish(wish.id);
          showToast('Wish deleted successfully', 'success');
        } catch (err) {
          showToast('Failed to delete wish', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
            <span>Birthday Wishes Log</span>
            <span className="text-xs bg-rose-500/20 text-rose-300 font-semibold px-2.5 py-0.5 rounded-full border border-rose-500/30">
              {wishes.length} Received
            </span>
          </h1>
          <p className="text-xs text-stone-400">View and manage heartfelt birthday wishes submitted by loved ones</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search wishes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-stone-600"
          />
        </div>
      </div>

      {filteredWishes.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center text-stone-500 space-y-3">
          <Sparkles className="w-8 h-8 mx-auto text-stone-600 animate-pulse" />
          <p className="text-xs font-medium text-stone-400">No birthday wishes found matching your filter.</p>
          <p className="text-[11px] text-stone-600">When guests or loved ones submit wishes on the site, they will appear here in real-time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWishes.map((wish) => {
            const displayName = wish.name || wish.herName || 'Sonali';
            const wishTextContent = wish.message || wish.wishText || '';
            return (
              <div
                key={wish.id}
                className="bg-stone-900 border border-stone-800/80 hover:border-stone-700/80 rounded-3xl p-5 space-y-3 flex flex-col justify-between transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-stone-100 line-clamp-1">{displayName}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-stone-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {wish.createdAt
                              ? new Date(wish.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Recently'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(wish)}
                      className="p-1.5 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Wish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800/50 rounded-2xl p-3.5 text-xs text-stone-300 italic relative leading-relaxed">
                    <MessageCircle className="w-3 h-3 text-stone-600 absolute top-2 right-2.5" />
                    "{wishTextContent}"
                  </div>
                </div>

              <div className="pt-2 border-t border-stone-800/50 flex items-center justify-between text-[10px] text-stone-500">
                <span className="flex items-center gap-1 text-rose-400/80">
                  <Heart className="w-3 h-3 fill-rose-500/20 text-rose-500" />
                  <span>Birthday Wish</span>
                </span>
                <span className="font-mono text-stone-600">ID: #{wish.id.slice(0, 6)}</span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
};
