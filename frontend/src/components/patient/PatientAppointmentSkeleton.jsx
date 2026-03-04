import React from 'react';

const pulse = 'animate-pulse rounded-md bg-[#EAF5FF]';

const PatientAppointmentSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#97E7F5] bg-gradient-to-r from-[#0f3779] via-[#0d7bc0] to-[#11a07f] p-5 shadow-[0_8px_26px_rgba(13,123,192,0.22)]">
        <div className={`${pulse} mb-3 h-6 w-64 bg-white/35`} />
        <div className={`${pulse} h-4 w-96 max-w-full bg-white/25`} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className={`${pulse} h-9 w-40`} />
        <div className={`${pulse} h-10 w-44`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={`tab-${idx}`} className={`${pulse} h-9 w-28 rounded-full`} />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`card-${idx}`} className="rounded-xl border border-[#D8EBFA] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className={`${pulse} h-12 w-12 rounded-lg`} />
                <div className="space-y-2">
                  <div className={`${pulse} h-4 w-48`} />
                  <div className={`${pulse} h-3 w-32`} />
                </div>
              </div>
              <div className={`${pulse} h-7 w-20 rounded-full`} />
            </div>
            <div className="space-y-2">
              <div className={`${pulse} h-3 w-72 max-w-full`} />
              <div className={`${pulse} h-3 w-56 max-w-full`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientAppointmentSkeleton;
