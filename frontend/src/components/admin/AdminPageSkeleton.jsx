import React from 'react';

const pulse = 'animate-pulse rounded-md bg-[#EAF5FF]';

const AdminPageSkeleton = ({ variant = 'table', rows = 4 }) => {
  const renderRows = (count) =>
    Array.from({ length: count }).map((_, index) => (
      <div key={`admin-row-${index}`} className="rounded-xl border border-[#D8EBFA] bg-white p-4 shadow-sm">
        <div className={`${pulse} mb-3 h-4 w-2/5`} />
        <div className={`${pulse} mb-2 h-3 w-3/4`} />
        <div className={`${pulse} h-3 w-1/2`} />
      </div>
    ));

  return (
    <div className="space-y-5">
      <div className="hidden rounded-2xl border border-[#CFE5F7] bg-white/90 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className={`${pulse} h-7 w-36 rounded-full`} />
        <div className={`${pulse} h-5 w-32`} />
      </div>

      <div className="rounded-2xl border border-[#97E7F5] bg-gradient-to-r from-[#0f3779] via-[#0d7bc0] to-[#11a07f] p-5 shadow-[0_8px_26px_rgba(13,123,192,0.22)]">
        <div className={`${pulse} mb-3 h-6 w-64 max-w-full bg-white/35`} />
        <div className={`${pulse} h-4 w-96 max-w-full bg-white/25`} />
      </div>

      {variant === 'dashboard' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`admin-stat-${idx}`} className="rounded-xl border border-[#D8EBFA] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`${pulse} h-3 w-1/2`} />
                  <div className={`${pulse} h-8 w-8 rounded-xl`} />
                </div>
                <div className={`${pulse} h-7 w-1/3`} />
              </div>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">{renderRows(2)}</div>
        </>
      )}

      {variant === 'charts' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-[#D8EBFA] bg-white p-4 shadow-sm">
            <div className={`${pulse} mb-4 h-4 w-40`} />
            <div className={`${pulse} h-64 w-full`} />
          </div>
          <div className="rounded-xl border border-[#D8EBFA] bg-white p-4 shadow-sm">
            <div className={`${pulse} mb-4 h-4 w-40`} />
            <div className={`${pulse} h-64 w-full`} />
          </div>
        </div>
      )}

      {variant === 'tabs' && (
        <>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`admin-tab-${idx}`} className={`${pulse} h-9 w-28 rounded-lg`} />
            ))}
          </div>
          <div className="space-y-3">{renderRows(rows)}</div>
        </>
      )}

      {variant === 'table' && (
        <>
          <div className="rounded-xl border border-[#D8EBFA] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className={`${pulse} h-10 flex-1`} />
              <div className={`${pulse} h-10 w-full sm:w-48`} />
            </div>
          </div>
          <div className="space-y-3">{renderRows(rows)}</div>
        </>
      )}
    </div>
  );
};

export default AdminPageSkeleton;
