// Dashboard.jsx - Clinician Dashboard with Real Data
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar, Users, ClipboardList, Clock, TrendingUp } from 'lucide-react';
import { getClinicianStats } from '../../api/ClinicianDashboard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';

export const ClinicianDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [pendingCerts, setPendingCerts] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getClinicianStats();
      const data = response.data.data;

      setStats(data.stats);
      setTodaySchedule(data.todaySchedule || []);
      setPendingCerts(data.pendingCerts || []);
      setWeeklyTrends(data.weeklyTrends || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return <StaffPageSkeleton variant="dashboard" rows={3} />;
  }

  const statCards = [
    { 
      title: "Today's Appointments", 
      value: stats?.todayAppointments || 0, 
      icon: Calendar, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      title: 'Upcoming (7 days)', 
      value: stats?.upcomingAppointments || 0, 
      icon: TrendingUp, 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    { 
      title: 'Total Patients', 
      value: stats?.totalPatients || 0, 
      icon: Users, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    { 
      title: 'Pending MedCerts', 
      value: stats?.pendingMedCerts || 0, 
      icon: ClipboardList, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Clinician Dashboard"
        subtitle="Track schedules, pending requests, and patient workload in real time."
        primaryAction={{ label: 'Open Schedule', to: '/clinician/schedule' }}
        secondaryAction={{ label: 'Patient List', to: '/clinician/patients' }}
      />

      <div>
        <h1 className="text-3xl font-bold text-[#01377D]">Clinician Dashboard</h1>
        <p className="text-[#009DD1] mt-2">Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card className="border-[#97E7F5] shadow-sm bg-white" key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-[#01377D]">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#01377D]">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Trends Chart */}
      {weeklyTrends.length > 0 && (
        <Card className="border-[#97E7F5] shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-[#01377D]">Weekly Appointment Trends</CardTitle>
            <CardDescription className="text-[#009DD1]">Appointments over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#009DD1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="border-[#97E7F5] shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-[#01377D]">Today's Schedule</CardTitle>
                <CardDescription className="text-[#009DD1]">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/clinician/schedule')}
                className="bg-[#009DD1] hover:bg-[#01377D] text-white"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border border-[#97E7F5] rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-[#009DD1] px-3 py-1 rounded text-sm font-medium">
                        {appointment.time}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#01377D]">{appointment.patient}</p>
                        <p className="text-xs text-gray-500">{appointment.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusBadgeVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending MedCert Requests */}
        <Card className="border-[#97E7F5] shadow-sm bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D]">
                  Pending MedCert Requests
                  {stats?.pendingMedCerts > 0 && (
                    <Badge variant="destructive" className="rounded-full">
                      {stats.pendingMedCerts}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Requests requiring your approval</CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/clinician/requests')}
                className="bg-[#009DD1] hover:bg-[#01377D] text-white"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingCerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending medical certificate requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCerts.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-[#97E7F5] rounded-lg hover:bg-orange-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#01377D]">{request.patient}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{request.type} - {request.purpose}</p>
                      <p className="text-xs text-orange-600 mt-1">{request.submitted}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/clinician/requests')}
                      className="border-[#009DD1] text-[#009DD1] hover:bg-blue-50"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-[#97E7F5] shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-[#01377D]">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 border-[#97E7F5] hover:bg-blue-50"
              onClick={() => navigate('/clinician/patients')}
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="w-5 h-5 text-[#009DD1]" />
                <span className="text-sm text-[#01377D]">View Patients</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 border-[#97E7F5] hover:bg-blue-50"
              onClick={() => navigate('/clinician/schedule')}
            >
              <div className="flex flex-col items-center gap-2">
                <Calendar className="w-5 h-5 text-[#009DD1]" />
                <span className="text-sm text-[#01377D]">Schedule</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 border-[#97E7F5] hover:bg-blue-50"
              onClick={() => navigate('/clinician/requests')}
            >
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#009DD1]" />
                <span className="text-sm text-[#01377D]">MedCert Requests</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 border-[#97E7F5] hover:bg-blue-50"
              onClick={loadDashboardData}
            >
              <div className="flex flex-col items-center gap-2">
                <Clock className="w-5 h-5 text-[#009DD1]" />
                <span className="text-sm text-[#01377D]">Refresh</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClinicianDashboard;