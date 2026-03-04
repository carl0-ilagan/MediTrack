// Reports.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Sparkles } from 'lucide-react';
import { getAdminStats, getAppointmentStats } from '../../api/AdminDashboard';
import { toast } from 'sonner';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';

export const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6');
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadReportsData();
  }, [period]);

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
    toast.info('Export functionality coming soon');
  };

  if (loading) {
    return <AdminPageSkeleton variant="charts" rows={3} />;
  }

  const completionRate = stats?.totalAppointments > 0 
    ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Reports panel
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-48 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:border-cyan-500 focus:ring-cyan-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-200 bg-white text-slate-700">
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 border-slate-200 bg-white text-cyan-700 hover:bg-cyan-50">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
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
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.totalUsers?.toLocaleString()}</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +{stats.userGrowth}% vs last period
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.totalAppointments?.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{completionRate}%</div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                {stats.completedAppointments} completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/80 bg-white/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Pending MedCerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-900">{stats.pendingMedCerts?.toLocaleString()}</div>
              <p className="text-xs text-orange-600 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Growth Chart */}
      <Card className="border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">User Growth</CardTitle>
          <CardDescription className="text-slate-500">Monthly user registration by role</CardDescription>
        </CardHeader>
        <CardContent>
          {userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill="#3b82f6" name="Patients" />
                <Bar dataKey="clinicians" fill="#10b981" name="Clinicians" />
                <Bar dataKey="admins" fill="#8b5cf6" name="Admins" />
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" name="Cancelled" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="Pending" />
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