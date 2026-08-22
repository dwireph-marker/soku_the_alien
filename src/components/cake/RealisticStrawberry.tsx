import React from 'react';

export const RealisticStrawberry: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const dimensions =
    size === 'sm'
      ? 'w-4 h-5 sm:w-5 sm:h-6'
      : size === 'lg'
      ? 'w-7 h-8 sm:w-8 sm:h-10'
      : 'w-5 h-6 sm:w-6 sm:h-7.5';

  return (
    <div className={`relative flex flex-col items-center group cursor-pointer filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] pointer-events-auto ${className}`}>
      <div className="absolute -bottom-1 w-6 sm:w-8 h-2.5 bg-gradient-to-b from-white via-amber-50 to-amber-100 rounded-full shadow-sm border border-amber-200/70 z-0" />
      <div className={`relative ${dimensions} z-10 transition-transform duration-300 group-hover:scale-115 group-hover:-translate-y-1`}>
        <div className="absolute -top-1.5 inset-x-0 flex justify-center items-center z-20">
          <div className="w-1 h-2 bg-emerald-950 rounded-full -mb-1 shadow-sm" />
          <div className="absolute top-0.5 flex gap-0.5">
            <div className="w-2 h-1.5 bg-emerald-600 rotate-45 rounded-sm shadow-sm" />
            <div className="w-2.5 h-1.5 bg-emerald-500 -rotate-30 rounded-sm shadow-sm" />
            <div className="w-2 h-1.5 bg-emerald-600 rotate-30 rounded-sm shadow-sm" />
          </div>
        </div>

        <div className="w-full h-full bg-gradient-to-b from-rose-500 via-red-600 to-red-950 rounded-t-full rounded-b-[75%] relative overflow-hidden border border-red-400/60 shadow-inner">
          <div className="absolute top-1 left-1 w-2.5 h-3.5 bg-gradient-to-br from-white/70 to-transparent rounded-full blur-[0.5px] -rotate-25" />
          <div className="absolute top-2 right-1 w-1 h-2 bg-white/30 rounded-full blur-[0.5px]" />

          <div className="absolute inset-x-0 top-1.5 bottom-1 flex flex-col justify-between items-center px-0.5 opacity-90">
            <div className="flex justify-around w-full">
              <div className="w-0.5 h-1 bg-amber-200/90 rounded-full rotate-12 shadow-sm" />
              <div className="w-0.5 h-1 bg-amber-200/90 rounded-full -rotate-12 shadow-sm" />
            </div>
            <div className="flex justify-between w-3/4">
              <div className="w-0.5 h-1 bg-amber-200/90 rounded-full -rotate-12 shadow-sm" />
              <div className="w-0.5 h-1 bg-amber-200/90 rounded-full rotate-12 shadow-sm" />
            </div>
            <div className="w-0.5 h-1 bg-amber-200/90 rounded-full shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
