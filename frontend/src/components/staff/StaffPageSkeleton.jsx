import React from 'react';

const pulse = 'animate-pulse rounded-md bg-[#EAF5FF]';

const StaffPageSkeleton = ({ variant = 'list', rows = 4 }) => {
  const renderRows = (count) =>
    Array.from({ length: count }).map((_, index) => (
      <div key={`row-${index}`} className="rounded-xl border border-[#d9effa] bg-white p-4 shadow-sm">
        <div className={`${pulse} mb-3 h-4 w-1/3`} />
        <div className={`${pulse} mb-2 h-3 w-2/3`} />
        <div className={`${pulse} h-3 w-1/2`} />
      </div>
    ));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#97E7F5] bg-gradient-to-r from-[#0f3779] via-[#0d7bc0] to-[#11a07f] p-5 shadow-[0_8px_26px_rgba(13,123,192,0.22)]">
        <div className={`${pulse} mb-3 h-6 w-2/5 bg-white/35`} />
        <div className={`${pulse} h-4 w-3/5 bg-white/25`} />
      </div>

      {variant === 'dashboard' && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`stat-${idx}`} className="rounded-xl border border-[#d9effa] bg-white p-4 shadow-sm">
                <div className={`${pulse} mb-2 h-3 w-1/2`} />
                <div className={`${pulse} h-7 w-1/3`} />
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">{renderRows(2)}</div>
          <div className="space-y-3">{renderRows(2)}</div>
        </>
      )}

      {variant === 'tabs' && (
        <>
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={`tab-${idx}`} className={`${pulse} h-9 w-28 rounded-lg`} />
            ))}
          </div>
          <div className="space-y-3">{renderRows(rows)}</div>
        </>
      )}

      {variant === 'list' && <div className="space-y-3">{renderRows(rows)}</div>}
    </div>
  );
};

export default StaffPageSkeleton;
