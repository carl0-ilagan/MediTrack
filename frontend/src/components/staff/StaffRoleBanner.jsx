import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

const StaffRoleBanner = ({
  title = 'Staff Portal',
  subtitle = 'Manage clinical workflows, patient data, and requests in one place.',
  primaryAction,
  secondaryAction,
}) => {
  const { user, isClinician, isAdmin } = useAuth();
  const isStaff = isClinician || isAdmin || user?.role === 'staff';

  if (!isStaff) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#97E7F5] bg-gradient-to-r from-[#0f3779] via-[#0d7bc0] to-[#11a07f] p-5 text-white shadow-[0_8px_26px_rgba(13,123,192,0.22)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 left-1/3 h-28 w-72 -rotate-6 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            Staff Access
          </div>
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          <p className="max-w-2xl text-sm text-blue-100/95">{subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {secondaryAction?.to && (
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/15">
              <Link to={secondaryAction.to}>{secondaryAction.label}</Link>
            </Button>
          )}
          {primaryAction?.to && (
            <Button asChild className="bg-[#0ea5e9] text-white shadow-[0_6px_18px_rgba(14,165,233,0.45)] hover:bg-[#0284c7] hover:text-white">
              <Link to={primaryAction.to} className="inline-flex items-center gap-2">
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffRoleBanner;
