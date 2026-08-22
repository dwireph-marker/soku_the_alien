import React from 'react';

export const AdminSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Header Skeleton */}
      <header className="h-16 border-b border-stone-800/80 bg-stone-900/50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-stone-800 animate-pulse" />
          <div className="w-40 h-5 rounded-lg bg-stone-800 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-8 rounded-xl bg-stone-800 animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-stone-800 animate-pulse" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Skeleton */}
        <aside className="w-64 border-r border-stone-800/80 bg-stone-900/30 p-4 space-y-3 hidden md:block">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-stone-800/60 animate-pulse" />
          ))}
        </aside>

        {/* Main Content Dashboard Skeleton */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Hero Banner Skeleton */}
          <div className="p-6 rounded-3xl border border-stone-800/80 bg-stone-900/40 space-y-3">
            <div className="w-32 h-4 rounded bg-stone-800 animate-pulse" />
            <div className="w-64 h-8 rounded-lg bg-stone-800 animate-pulse" />
            <div className="w-96 h-4 rounded bg-stone-800/70 animate-pulse" />
          </div>

          {/* Stats Cards Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-stone-800/80 bg-stone-900/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="w-20 h-3 rounded bg-stone-800 animate-pulse" />
                  <div className="w-6 h-6 rounded-lg bg-stone-800 animate-pulse" />
                </div>
                <div className="w-16 h-7 rounded bg-stone-800 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Table / Content Cards Skeleton */}
          <div className="p-6 rounded-3xl border border-stone-800/80 bg-stone-900/40 space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-48 h-6 rounded bg-stone-800 animate-pulse" />
              <div className="w-28 h-9 rounded-xl bg-stone-800 animate-pulse" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-stone-800/40 animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
