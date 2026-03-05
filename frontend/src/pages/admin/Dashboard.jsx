// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, FileText, Activity, AlertCircle, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { getAdminStats } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getAdminStats();
      const data = response.data.data;
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminPageSkeleton variant="dashboard" rows={4} />;
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.stats.totalUsers.toLocaleString(), 
      change: `${stats.stats.userGrowth > 0 ? '+' : ''}${stats.stats.userGrowth}%`, 
      icon: Users, 
      iconWrap: 'bg-slate-100 text-slate-700',
      cardClass: 'border-slate-200/80 bg-gradient-to-b from-white to-slate-50',
      textClass: 'text-slate-900',
      subLabel: 'All registered users',
      positive: stats.stats.userGrowth >= 0
    },
    { 
      title: 'Today\'s Appointments', 
      value: stats.stats.todayAppointments.toLocaleString(), 
      change: `${stats.stats.totalAppointments} total`, 
      icon: Calendar, 
      iconWrap: 'bg-cyan-100 text-cyan-700',
      cardClass: 'border-cyan-200/60 bg-gradient-to-b from-white to-cyan-50/40',
      textClass: 'text-cyan-700',
      subLabel: 'Scheduled for today',
    },
    { 
      title: 'Pending MedCerts', 
      value: stats.stats.pendingMedCerts.toLocaleString(), 
      change: 'Awaiting review', 
      icon: FileText, 
      iconWrap: 'bg-amber-100 text-amber-700',
      cardClass: 'border-amber-200/60 bg-gradient-to-b from-white to-amber-50/40',
      textClass: 'text-amber-700',
      subLabel: 'Queue for clinician review',
    },
    { 
      title: 'Completed Appointments', 
      value: stats.stats.completedAppointments.toLocaleString(), 
      change: 'All time', 
      icon: CheckCircle, 
      iconWrap: 'bg-emerald-100 text-emerald-700',
      cardClass: 'border-emerald-200/60 bg-gradient-to-b from-white to-emerald-50/40',
      textClass: 'text-emerald-700',
      subLabel: 'Finished visits',
    },
  ];

  const roleStats = [
    {
      label: 'Patients',
      count: stats.userDistribution.patients,
      barClass: 'bg-blue-500',
    },
    {
      label: 'Clinicians',
      count: stats.userDistribution.clinicians,
      barClass: 'bg-emerald-500',
    },
    {
      label: 'Administrators',
      count: stats.userDistribution.admins,
      barClass: 'bg-violet-500',
    },
  ];
  const totalUsers = stats.stats.totalUsers || 0;
  const toPercent = (count) => (totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0);

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Dashboard panel
        </div>
        <p className="text-xs text-slate-500">Updated in real-time</p>
      </div>

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/90">Clinic Intelligence</p>
        <h2 className="mt-2 text-2xl font-semibold">Welcome back, Admin</h2>
        <p className="mt-2 max-w-2xl text-sm text-cyan-100/90">
          Track users, appointments, and med cert requests in one place with a cleaner and faster dashboard view.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`${stat.cardClass} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.title}</p>
                    <p className={`mt-3 text-3xl font-semibold ${stat.textClass}`}>{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.subLabel}</p>
                    <p className={`mt-2 text-xs ${stat.positive === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${stat.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Recent Activity</CardTitle>
            <CardDescription className="text-slate-500">Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0">
                    {activity.status === 'success' && (
                      <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                    )}
                    {activity.status === 'warning' && (
                      <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                    {activity.status === 'info' && (
                      <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-blue-50">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">{activity.message}</p>
                      <p className="mt-1 text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-slate-500">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="border-slate-200/80 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">User Distribution</CardTitle>
            <CardDescription className="text-slate-500">Active users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleStats.map((role) => (
                <div key={role.label}>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-slate-600">{role.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {role.count} ({toPercent(role.count)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div 
                      className={`${role.barClass} h-2 rounded-full transition-all`} 
                      style={{ width: `${toPercent(role.count)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {stats.stats.totalUsers === 0 && (
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-slate-600">No users yet</span>
                    <span className="text-sm font-semibold text-slate-900">0 (0%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 w-0 rounded-full bg-slate-300"></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;