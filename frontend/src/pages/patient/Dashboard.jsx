// Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { fetchPatientDashboardOverview } from '../../api/PatientPortal';
import { Calendar, FileText, Upload, FileCheck, Clock, Activity, Loader2 } from 'lucide-react';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';
import PatientPageSkeleton from '../../components/patient/PatientPageSkeleton';

const quickActions = [
  { icon: Calendar, label: 'Book Appointment', link: '/patient/appointment' },
  { icon: FileText, label: 'View Records', link: '/patient/records' },
  { icon: Upload, label: 'Upload Document', link: '/patient/upload-document' },
  { icon: FileCheck, label: 'Request Certificate', link: '/patient/request-certificate' },
];

const formatDisplayDate = (date, withTime = false) => {
  if (!date) return '—';
  try {
    const parsed = new Date(date);
    return withTime
      ? format(parsed, 'MMM d, yyyy • h:mm a')
      : format(parsed, 'MMM d, yyyy');
  } catch (err) {
    return '—';
  }
};

const titleCase = (value = '') =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export const PatientDashboard = () => {
  const { user } = useAuth();
  const patientId = user?.patient?.id;
  const [loading, setLoading] = useState(true);
  const createEmptyCollection = () => ({ data: [], meta: {} });
  const buildDefaultOverview = () => ({
    appointments: createEmptyCollection(),
    medCerts: createEmptyCollection(),
    documents: createEmptyCollection(),
    patient: null,
  });
  const [overview, setOverview] = useState(buildDefaultOverview);
  const [loadError, setLoadError] = useState('');
  const [hasPatientRecord, setHasPatientRecord] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const result = await fetchPatientDashboardOverview(patientId);
        if (!isMounted) return;

        setOverview(result);
        setHasPatientRecord(Boolean(result.patient || patientId));
      } catch (error) {
        console.error('Failed to load patient dashboard', error);
        if (isMounted) {
          setOverview(buildDefaultOverview());
          setLoadError('Unable to load some dashboard data. Please try again later.');
          toast.error('Showing limited dashboard data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, patientId]);

  const appointmentsData = overview.appointments?.data ?? [];
  const medCertsData = overview.medCerts?.data ?? [];
  const documentsData = overview.documents?.data ?? [];

  const upcomingAppointments = useMemo(() => {
    return appointmentsData
      .filter((appointment) => {
        const start = new Date(appointment.start_time);
        const now = new Date();
        return (
          start >= now &&
          ['confirmed', 'in_progress'].includes((appointment.status || '').toLowerCase())
        );
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 3);
  }, [appointmentsData]);

  const pendingAppointments = useMemo(() => {
    return appointmentsData
      .filter((appointment) => {
        const start = new Date(appointment.start_time);
        const now = new Date();
        return (
          start >= now &&
          (appointment.status || '').toLowerCase() === 'scheduled'
        );
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 3);
  }, [appointmentsData]);

  const pendingMedCerts = useMemo(
    () => medCertsData.filter((cert) => (cert.status || '').toLowerCase() === 'pending'),
    [medCertsData]
  );

  const recentActivity = useMemo(() => {
    const activities = [];

    medCertsData.forEach((cert) => {
      activities.push({
        id: `cert-${cert.id}`,
        type: 'certificate',
        message: `${titleCase(cert.type)} ${titleCase(cert.status)}`,
        date: cert.updated_at || cert.created_at,
      });
    });

    documentsData.forEach((doc) => {
      activities.push({
        id: `doc-${doc.id}`,
        type: 'document',
        message: `Document uploaded: ${doc.name}`,
        date: doc.created_at,
      });
    });

    appointmentsData.forEach((appointment) => {
      activities.push({
        id: `apt-${appointment.id}`,
        type: 'appointment',
        message: `${appointment.title || 'Appointment'} ${titleCase(appointment.status)}`,
        date: appointment.updated_at || appointment.start_time,
      });
    });

    return activities
      .filter((activity) => activity.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [medCertsData, documentsData, appointmentsData]);

  const stats = [
    {
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      subtext: 'Confirmed/In Progress',
      trend: upcomingAppointments.length > 0 ? `+${upcomingAppointments.length} active this week` : 'No upcoming schedule',
      icon: Calendar,
    },
    {
      label: 'Pending Appointments',
      value: pendingAppointments.length,
      subtext: 'Awaiting confirmation',
      trend: pendingAppointments.length > 0 ? `${pendingAppointments.length} pending requests` : 'All clear for now',
      icon: Clock,
    },
    {
      label: 'Pending Certificates',
      value: pendingMedCerts.length,
      subtext: 'Awaiting review',
      trend: pendingMedCerts.length > 0 ? `${pendingMedCerts.length} awaiting action` : 'No pending certificates',
      icon: FileCheck,
    },
    {
      label: 'Uploaded Documents',
      value: overview.documents?.meta?.total ?? documentsData.length,
      subtext: 'All-time total',
      trend: 'Lifetime records',
      icon: FileText,
    },
  ];

  const patientDetails = overview.patient || user?.patient || null;

  if (loading) {
    return <PatientPageSkeleton variant="dashboard" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title={
          patientDetails?.user?.name
            ? `Welcome back, ${patientDetails.user.name}`
            : 'Welcome to your patient dashboard'
        }
        subtitle="Track appointments, certificates, and previous laboratory files with quick access tools."
        primaryAction={{ label: 'Book Appointment', to: '/patient/appointment' }}
        secondaryAction={{ label: 'Previous Laboratory', to: '/patient/previous-laboratory' }}
      />

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
          {loadError}
        </div>
      )}

      {!loading && !hasPatientRecord && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 shadow-sm">
          We could not find a linked clinic record yet. Some sections may be hidden until your profile is completed.
        </div>
      )}

      <>
          {/* Quick Actions */}
          <Card className="border-[#BFE6FB] bg-[#F4FAFF] shadow-[0_4px_20px_rgba(14,165,233,0.08)] transition-all duration-300 hover:shadow-[0_8px_28px_rgba(14,165,233,0.14)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-[#0f2d57]">Quick Actions</CardTitle>
              <CardDescription className="text-sm text-[#406A93]">
                Fast shortcuts to common patient tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <Link key={action.label} to={action.link}>
                      <div className="group rounded-xl border border-[#D8EBFA] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#9FD5F5] hover:shadow-[0_8px_24px_rgba(2,132,199,0.14)]">
                        <div className="mb-3 inline-flex rounded-lg bg-[#E8F5FF] p-2 text-[#0284c7] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#d9efff]">
                          <ActionIcon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-normal text-[#20466e] group-hover:text-[#0f2d57]">
                          {action.label}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-[#21476f]">{stat.label}</CardTitle>
                    <div className="rounded-md bg-[#E8F5FF] p-1.5 text-[#0284c7]">
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold leading-none text-[#0f2d57]">{stat.value}</p>
                  {stat.subtext && <p className="mt-1 text-xs text-gray-500">{stat.subtext}</p>}
                  <p className="mt-2 text-[11px] font-medium text-[#0284c7]">{stat.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-5">
            {/* Appointments Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Appointments */}
              <Card className="border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-[#01377D]">Upcoming Appointments</CardTitle>
                      <CardDescription className="text-[#009DD1]">
                        Confirmed & In Progress
                      </CardDescription>
                    </div>
                    <Link to="/patient/appointment">
                      <Button size="sm" className="border-[#01377D] text-[#01377D]">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No upcoming appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-3 rounded-lg border border-[#97E7F5] p-3 transition-all duration-300 hover:border-[#009DD1] hover:bg-[#F8FCFF]"
                        >
                          <div className="bg-green-50 p-2 rounded-lg flex-shrink-0">
                            <Calendar className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#01377D] mb-1 truncate">
                              {appointment.type || appointment.title || 'Clinic Visit'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {formatDisplayDate(appointment.start_time, true)}
                              </span>
                            </div>
                            {appointment.status?.toLowerCase() === 'in_progress' && (
                              <Badge className="border-0 bg-blue-100 text-xs font-medium text-blue-800">
                                In progress
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Appointments */}
              <Card className="border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-[#01377D]">Pending Appointments</CardTitle>
                      <CardDescription className="text-[#009DD1]">
                        Awaiting confirmation
                      </CardDescription>
                    </div>
                    <Link to="/patient/appointment">
                      <Button size="sm" className="border-[#01377D] text-[#01377D]">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {pendingAppointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No pending appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-3 rounded-lg border border-[#97E7F5] p-3 transition-all duration-300 hover:border-[#009DD1] hover:bg-[#F8FCFF]"
                        >
                          <div className="bg-yellow-50 p-2 rounded-lg flex-shrink-0">
                            <Clock className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#01377D] mb-1 truncate">
                              {appointment.type || appointment.title || 'Clinic Visit'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {formatDisplayDate(appointment.start_time, true)}
                              </span>
                            </div>
                            <Badge className="border-0 bg-yellow-100 text-xs font-medium text-yellow-800">
                              Awaiting confirmation
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]">
              <CardHeader>
                <CardTitle className="text-[#01377D]">Recent Activity</CardTitle>
                <CardDescription className="text-[#009DD1]">
                  Latest updates across your records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-lg border border-transparent p-2 transition-all duration-300 hover:border-[#97E7F5] hover:bg-[#F8FCFF]"
                      >
                        <Activity className="mt-0.5 w-5 h-5 text-[#01377D]" />
                        <div className="flex-1">
                          <p className="text-sm text-[#01377D]">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDisplayDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          
          </div>
      </>
    </div>
  );
};

export default PatientDashboard;
