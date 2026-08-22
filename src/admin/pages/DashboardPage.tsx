import React from 'react';
import {
  Image as ImageIcon,
  Heart,
  Ticket,
  Sparkles,
  Music,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CalendarClock,
  UserCheck
} from 'lucide-react';
import { SiteConfig, BirthdayWish, AuditLog } from '../../types';
import { AdminTab } from '../AdminLayout';
import { formatBirthdayShortDisplay } from '../../utils/birthdayCountdown';

interface DashboardPageProps {
  config: SiteConfig | null;
  memories?: any[];
  reasons?: any[];
  vouchers?: any[];
  wishes: BirthdayWish[];
  auditLogs: AuditLog[];
  onSelectTab: (tab: AdminTab) => void;
  onRefresh: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  config,
  memories = [],
  reasons = [],
  vouchers = [],
  wishes = [],
  auditLogs = [],
  onSelectTab,
  onRefresh
}) => {
  const photoList = memories.length > 0 ? memories : (config?.photos || []);
  const reasonList = reasons.length > 0 ? reasons : (config?.reasons || []);
  const voucherList = vouchers.length > 0 ? vouchers : (config?.vouchers || []);

  const totalLikes = photoList.reduce((acc, p) => acc + (p.likes || 0), 0);
  const unreadWishes = (wishes || []).filter(w => !w.isViewed).length;

  const statCards = [
    { label: '👤 Names & Site Settings', value: `${config?.herName || 'Sonali'} & ${config?.hisName || 'Gunjan'}`, icon: UserCheck, color: 'text-rose-400', tab: 'settings' },
    { label: '🎂 Birthday & Time', value: formatBirthdayShortDisplay(config), icon: CalendarClock, color: 'text-amber-400', tab: 'birthday' },
    { label: 'Memories & Photos', value: photoList.length, icon: ImageIcon, color: 'text-amber-400', tab: 'memories' },
    { label: 'Love Reasons', value: reasonList.length, icon: Heart, color: 'text-rose-400', tab: 'reasons' },
    { label: 'Love Vouchers', value: voucherList.length, icon: Ticket, color: 'text-emerald-400', tab: 'vouchers' },
    { label: 'Girlfriend Wishes', value: wishes?.length || 0, badge: unreadWishes ? `${unreadWishes} unread` : null, icon: Sparkles, color: 'text-purple-400', tab: 'wishes' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/40 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-100">
            Managing Birthday Site for <span className="text-amber-300">{config?.herName || 'Her'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-xl">
            Update personal text, memory photo gallery via ImageKit, love vouchers, and celebration settings in real-time.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-2 border border-stone-700 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(card.tab as AdminTab)}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-2xl p-6 cursor-pointer transition-all hover:translate-y-[-2px] group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-stone-400">{card.label}</span>
                <div className={`p-2.5 bg-stone-950 rounded-xl border border-stone-800 ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-stone-100">{card.value}</span>
                {card.badge && (
                  <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs text-stone-500 group-hover:text-amber-400 transition-colors">
                <span>Manage section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <h3 className="text-sm font-semibold text-stone-200 mb-4">Quick Management Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectTab('memories')}
            className="p-4 rounded-2xl bg-stone-950 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/30 text-left transition-all group"
          >
            <ImageIcon className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-stone-200">Upload Photos</p>
            <p className="text-[10px] text-stone-500">Add to Memory Reel</p>
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className="p-4 rounded-2xl bg-stone-950 hover:bg-rose-500/10 border border-stone-800 hover:border-rose-500/30 text-left transition-all group"
          >
            <Heart className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-stone-200">Edit Messages</p>
            <p className="text-[10px] text-stone-500">Her Name & Letter</p>
          </button>
          <button
            onClick={() => onSelectTab('vouchers')}
            className="p-4 rounded-2xl bg-stone-950 hover:bg-emerald-500/10 border border-stone-800 hover:border-emerald-500/30 text-left transition-all group"
          >
            <Ticket className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-stone-200">Manage Vouchers</p>
            <p className="text-[10px] text-stone-500">Love Tickets</p>
          </button>
          <button
            onClick={() => onSelectTab('celebration')}
            className="p-4 rounded-2xl bg-stone-950 hover:bg-purple-500/10 border border-stone-800 hover:border-purple-500/30 text-left transition-all group"
          >
            <Sparkles className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-semibold text-stone-200">Cake Settings</p>
            <p className="text-[10px] text-stone-500">Candles & Confetti</p>
          </button>
        </div>
      </div>

      {/* Audit Log Preview */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-200">Recent Admin Activity</h3>
          <button
            onClick={() => onSelectTab('audit-logs')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            View all logs
          </button>
        </div>
        <div className="space-y-3">
          {(auditLogs || []).slice(0, 5).map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 text-xs">
              <div>
                <span className="font-semibold text-amber-300 mr-2">[{log.action}]</span>
                <span className="text-stone-300">{log.description}</span>
              </div>
              <span className="text-[10px] text-stone-500 shrink-0 ml-4">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
