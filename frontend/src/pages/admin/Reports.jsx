// Reports.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Sparkles, Users, CalendarClock, CheckCircle2, FileClock, Filter, ChevronDown, Check } from 'lucide-react';
import { getAdminStats, getAppointmentStats } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const Reports = () => {
  const PERIOD_OPTIONS = [
    { value: '3', label: 'Last 3 Months' },
    { value: '6', label: 'Last 6 Months' },
    { value: '12', label: 'Last Year' },
  ];
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [stats, setStats] = useState(null);
  const periodMenuRef = useRef(null);

  useEffect(() => {
    loadReportsData();
  }, [period]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target)) {
        setIsPeriodOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsPeriodOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [statsResponse, appointmentsResponse] = await Promise.all([
        getAdminStats(),
        getAppointmentStats(parseInt(period))
      ]);

      const statsData = statsResponse.data.data;
      const appointmentsData = appointmentsResponse.data.data;

      setStats(statsData.stats);
      setUserGrowthData(statsData.monthlyGrowth || []);
      setAppointmentData(appointmentsData || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const summaryRows = [
        ['Metric', 'Value'],
        ['Period (months)', period],
        ['Total Users', stats?.totalUsers ?? 0],
        ['User Growth (%)', stats?.userGrowth ?? 0],
        ['Total Appointments', stats?.totalAppointments ?? 0],
        ['Completed Appointments', stats?.completedAppointments ?? 0],
        ['Completion Rate (%)', completionRate],
        ['Pending MedCerts', stats?.pendingMedCerts ?? 0],
      ];

      const growthRows = [
        [],
        ['User Growth Data'],
        ['Month', 'Patients', 'Clinicians', 'Admins'],
        ...userGrowthData.map((row) => [
          row.month ?? '',
          row.patients ?? 0,
          row.clinicians ?? 0,
          row.admins ?? 0,
        ]),
      ];

      const appointmentRows = [
        [],
        ['Appointment Trends Data'],
        ['Month', 'Completed', 'Cancelled', 'Pending'],
        ...appointmentData.map((row) => [
          row.month ?? '',
          row.completed ?? 0,
          row.cancelled ?? 0,
          row.pending ?? 0,
        ]),
      ];

      const allRows = [...summaryRows, ...growthRows, ...appointmentRows];
      const csvContent = allRows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports-${period}m-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <AdminPageSkeleton variant="charts" rows={3} />;
  }

  const completionRate = stats?.totalAppointments > 0 
    ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
    : 0;
  const selectedPeriodLabel = PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'Select Period';

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Reports panel
        </div>
        <p className="text-xs text-slate-500">Visual overview of growth and trends</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5" />
          Analytics mode
        </div>
        <h2 className="mt-2 text-2xl font-semibold">Reports & Analytics</h2>
        <p className="mt-3 max-w-2xl text-sm text-cyan-100/90">Analyze growth, performance, and trends with a cleaner and more focused reporting experience.</p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Users</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalUsers?.toLocaleString()}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    +{stats.userGrowth}% vs last period
                  </p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-200/60 bg-gradient-to-b from-white to-cyan-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Total Appointments</p>
                  <p className="mt-3 text-3xl font-semibold text-cyan-700">{stats.totalAppointments?.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-cyan-700/80">All time records</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 text-cyan-700">
                  <CalendarClock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Completion Rate</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-700">{completionRate}%</p>
                  <p className="mt-1 text-xs text-emerald-700/80">{stats.completedAppointments} completed</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200/60 bg-gradient-to-b from-white to-amber-50/40 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Pending MedCerts</p>
                  <p className="mt-3 text-3xl font-semibold text-amber-700">{stats.pendingMedCerts?.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-amber-700/80">Awaiting review</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <FileClock className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Growth Chart */}
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-end">
        <div ref={periodMenuRef} className="relative w-full md:w-48">
          <button
            type="button"
            onClick={() => setIsPeriodOpen((prev) => !prev)}
            className="flex h-11 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 transition-all duration-200 hover:border-cyan-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-expanded={isPeriodOpen}
            aria-haspopup="listbox"
          >
            <span className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {selectedPeriodLabel}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isPeriodOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>

          <div
            className={`absolute right-0 z-30 mt-2 w-full origin-top rounded-md border border-slate-200 bg-white p-1.5 shadow-lg transition-all duration-200 ${
              isPeriodOpen
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none -translate-y-1 scale-95 opacity-0'
            }`}
            role="listbox"
          >
            {PERIOD_OPTIONS.map((option) => {
              const isActive = option.value === period;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPeriod(option.value);
                    setIsPeriodOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-2.5 py-2 text-left text-sm transition ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isActive && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" className="w-full border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50 md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">User Growth</CardTitle>
          <CardDescription className="text-slate-500">Monthly user registration by role</CardDescription>
        </CardHeader>
        <CardContent>
          {userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="patients" fill="#3b82f6" name="Patients" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clinicians" fill="#10b981" name="Clinicians" radius={[6, 6, 0, 0]} />
                <Bar dataKey="admins" fill="#8b5cf6" name="Admins" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-500">No user growth data available</p>
          )}
        </CardContent>
      </Card>

      {/* Appointment Trends */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Appointment Trends</CardTitle>
          <CardDescription className="text-slate-500">Monthly appointment statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {appointmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={appointmentData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Completed" />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Cancelled" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8 text-gray-500">No appointment data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;