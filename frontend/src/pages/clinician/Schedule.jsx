// Schedule.jsx - Appointment Calendar with Real Data
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Loader2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { getClinicianAppointments, updateAppointmentStatus, cancelAppointment, rejectAppointment, confirmAppointment } from '../../api/ClinicianDashboard';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';
import StaffPageSkeleton from '../../components/staff/StaffPageSkeleton';

export const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // For calendar selection
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [currentDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const response = await getClinicianAppointments({
        start_date: format(monthStart, 'yyyy-MM-dd'),
        end_date: format(monthEnd, 'yyyy-MM-dd')
      });
      
      console.log('Clinician appointments response:', response);
      console.log('Appointments data:', response.data);
      console.log('Parsed appointments:', response.data.data || []);
      
      setAppointments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointmentHandler = async (appointmentId) => {
    try {
      setConfirmingId(appointmentId);
      await confirmAppointment(appointmentId);
      toast.success('Appointment confirmed successfully');
      loadAppointments(); // Reload to update the list
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
      toast.error('Failed to confirm appointment');
    } finally {
      setConfirmingId(null);
    }
  };

  const openRejectDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  const handleRejectAppointment = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setRejectingId(selectedAppointment.id);
      await rejectAppointment(selectedAppointment.id, rejectReason);
      toast.success('Appointment rejected. Patient will be notified to reschedule.');
      setShowRejectDialog(false);
      setSelectedAppointment(null);
      setRejectReason('');
      loadAppointments();
    } catch (err) {
      console.error('Failed to reject appointment:', err);
      toast.error('Failed to reject appointment');
    } finally {
      setRejectingId(null);
    }
  };

  const updateStatus = async (appointmentId, newStatus, successMessage) => {
    try {
      setUpdatingStatusId(appointmentId);
      await updateAppointmentStatus(appointmentId, newStatus);
      toast.success(successMessage);
      loadAppointments();
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
      toast.error('Failed to update appointment status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleStartAppointment = (appointmentId) => {
    updateStatus(appointmentId, 'in_progress', 'Appointment started');
  };

  const handleCompleteAppointment = (appointmentId) => {
    updateStatus(appointmentId, 'completed', 'Appointment marked as completed');
  };

  const handleMarkNoShow = (appointmentId) => {
    updateStatus(appointmentId, 'no_show', 'Marked as no-show');
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = format(currentDate, 'MMMM yyyy');

  // Appointments for the selected date - only confirmed and in_progress (actual booked slots)
  const selectedDateAppointments = appointments.filter(apt => {
    const status = apt.status?.toLowerCase();
    return (
      apt.start_time && 
      isSameDay(new Date(apt.start_time), selectedDate) &&
      (status === 'confirmed' || status === 'in_progress' || status === 'completed')
    );
  });

  const upcomingAppointments = appointments.filter(apt => 
    apt.start_time && 
    new Date(apt.start_time) > new Date() && 
    apt.status?.toLowerCase() === 'confirmed'
  ).slice(0, 5);

  // Pending appointments that haven't been confirmed or rejected yet
  const pendingAppointments = appointments.filter(apt => 
    apt.status?.toLowerCase() === 'scheduled' && new Date(apt.start_time) > new Date()
  );

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAppointmentTypeLabel = (appointment) => {
    if (!appointment) return 'Consultation';
    if (appointment.appointment_type && typeof appointment.appointment_type === 'object') {
      return appointment.appointment_type.name || 'Consultation';
    }
    return appointment.appointment_type || appointment.type || 'Consultation';
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const hasAppointmentOnDay = (day) => {
    return appointments.some(apt => {
      const status = apt.status?.toLowerCase();
      return (
        apt.start_time && 
        isSameDay(new Date(apt.start_time), day) &&
        (status === 'confirmed' || status === 'in_progress' || status === 'completed')
      );
    });
  };

  if (loading) {
    return <StaffPageSkeleton variant="dashboard" rows={3} />;
  }

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Schedule"
        subtitle="Monitor upcoming visits, confirm pending appointments, and manage daily operations."
        primaryAction={{ label: 'Request Management', to: '/clinician/requests' }}
      />

      <div>
        <h1 className="text-3xl font-bold text-[#01377D]">Schedule</h1>
        <p className="text-[#009DD1] mt-2">View and manage your appointments</p>
      </div>

      <>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-2 border-[#97E7F5] shadow-sm bg-white">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-[#01377D]">
                    <CalendarIcon className="w-5 h-5 text-[#009DD1]" />
                    {currentMonth}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateMonth(-1)}
                      className="border-[#97E7F5] hover:bg-blue-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateMonth(1)}
                      className="border-[#97E7F5] hover:bg-blue-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-sm text-[#01377D] font-medium py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, i) => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isTodayDate = isToday(day);
                    const isSelectedDate = isSameDay(day, selectedDate);
                    const hasAppointments = hasAppointmentOnDay(day);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => isCurrentMonth && setSelectedDate(day)}
                        disabled={!isCurrentMonth}
                        className={`
                          aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${!isCurrentMonth ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
                          ${isCurrentMonth && !isTodayDate && !hasAppointments ? 'bg-white hover:bg-blue-50 border border-gray-200 text-gray-700' : ''}
                          ${isCurrentMonth && hasAppointments && !isTodayDate && !isSelectedDate ? 'bg-blue-100 border-2 border-[#009DD1] text-[#01377D] hover:bg-blue-200' : ''}
                          ${isTodayDate && !isSelectedDate ? 'bg-[#009DD1] text-white hover:bg-[#01377D] font-bold border-2 border-[#009DD1]' : ''}
                          ${isSelectedDate && !isTodayDate ? 'bg-[#01377D] text-white font-bold border-2 border-[#01377D] ring-2 ring-offset-2 ring-[#009DD1]' : ''}
                          ${isSelectedDate && isTodayDate ? 'bg-[#01377D] text-white font-bold border-2 border-[#009DD1] ring-2 ring-offset-2 ring-[#009DD1]' : ''}
                          cursor-pointer
                        `}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Selected Date Appointments */}
            <Card className="border-[#97E7F5] shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-[#01377D]">
                  {isToday(selectedDate) ? "Today's Appointments" : "Appointments"}
                </CardTitle>
                <CardDescription className="text-[#009DD1]">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDateAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{isToday(selectedDate) ? 'No appointments today' : 'No appointments on this date'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateAppointments.map((appointment) => {
                      const appointmentTime = new Date(appointment.start_time);
                      const now = new Date();
                      const isPast = appointmentTime < now;
                      const isWithin30Min = appointmentTime - now <= 30 * 60 * 1000 && appointmentTime > now;
                      const status = appointment.status?.toLowerCase();
                      
                      return (
                        <div key={appointment.id} className="p-3 border border-[#97E7F5] rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-[#01377D]">
                                {appointment.start_time ? format(new Date(appointment.start_time), 'h:mm a') : 'N/A'}
                              </span>
                            </div>
                            <Badge variant="outline" className={getStatusBadgeVariant(appointment.status)}>
                              {appointment.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#01377D]">
                              {appointment.patient?.user?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {getAppointmentTypeLabel(appointment)}
                            </p>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 flex-wrap">
                            {status === 'confirmed' && (isWithin30Min || isToday(selectedDate)) && (
                              <Button 
                                size="sm" 
                                onClick={() => handleStartAppointment(appointment.id)}
                                disabled={updatingStatusId === appointment.id}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start'}
                              </Button>
                            )}
                            
                            {status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleCompleteAppointment(appointment.id)}
                                disabled={updatingStatusId === appointment.id}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Complete'}
                              </Button>
                            )}
                            
                            {(status === 'confirmed' || status === 'in_progress') && isPast && (
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkNoShow(appointment.id)}
                                disabled={updatingStatusId === appointment.id}
                                variant="outline"
                                className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs"
                              >
                                {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'No-Show'}
                              </Button>
                            )}
                            
                            {(status === 'completed' || status === 'cancelled' || status === 'no_show') && (
                              <span className="text-xs text-gray-500 italic">Finalized</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Appointments (Need Confirmation) */}
          {pendingAppointments.length > 0 && (
            <Card className="border-yellow-200 shadow-sm bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-[#01377D] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Pending Appointments ({pendingAppointments.length})
                </CardTitle>
                <CardDescription className="text-[#009DD1]">
                  Appointments waiting for confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-4 border border-yellow-300 bg-white rounded-lg hover:bg-yellow-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-gray-500">
                            {appointment.start_time ? format(new Date(appointment.start_time), 'EEE') : 'N/A'}
                          </p>
                          <p className="text-lg font-bold text-[#01377D]">
                            {appointment.start_time ? format(new Date(appointment.start_time), 'd') : ''}
                          </p>
                        </div>
                        <div className="h-12 w-px bg-gray-200"></div>
                        <div>
                          <p className="font-medium text-[#01377D]">
                            {appointment.patient?.user?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getAppointmentTypeLabel(appointment)} • {' '}
                            {appointment.start_time ? format(new Date(appointment.start_time), 'h:mm a') : 'N/A'}
                          </p>
                          {appointment.description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {appointment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => openRejectDialog(appointment)}
                          disabled={confirmingId === appointment.id || rejectingId === appointment.id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => confirmAppointmentHandler(appointment.id)}
                          disabled={confirmingId === appointment.id || rejectingId === appointment.id}
                          className="bg-[#009DD1] hover:bg-[#01377D] text-white"
                        >
                          {confirmingId === appointment.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Confirming...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Confirm
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          <Card className="border-[#97E7F5] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#01377D]">Upcoming Appointments</CardTitle>
              <CardDescription className="text-[#009DD1]">Next scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => {
                    const appointmentTime = new Date(appointment.start_time);
                    const now = new Date();
                    const isPast = appointmentTime < now;
                    const isWithin30Min = appointmentTime - now <= 30 * 60 * 1000 && appointmentTime > now;
                    const status = appointment.status?.toLowerCase();
                    
                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-[#97E7F5] rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-gray-500">
                              {appointment.start_time ? format(new Date(appointment.start_time), 'EEE') : 'N/A'}
                            </p>
                            <p className="text-lg font-bold text-[#01377D]">
                              {appointment.start_time ? format(new Date(appointment.start_time), 'd') : ''}
                            </p>
                          </div>
                          <div className="h-12 w-px bg-gray-200"></div>
                          <div className="flex-1">
                            <p className="font-medium text-[#01377D]">
                              {appointment.patient?.user?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {getAppointmentTypeLabel(appointment)} • {' '}
                              {appointment.start_time ? format(new Date(appointment.start_time), 'h:mm a') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusBadgeVariant(appointment.status)}>
                            {appointment.status?.replace('_', ' ')}
                          </Badge>
                          
                          {status === 'confirmed' && (isWithin30Min || isToday(appointmentTime)) && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStartAppointment(appointment.id)}
                              disabled={updatingStatusId === appointment.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Start'}
                            </Button>
                          )}
                          
                          {status === 'in_progress' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleCompleteAppointment(appointment.id)}
                              disabled={updatingStatusId === appointment.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Complete'}
                            </Button>
                          )}
                          
                          {(status === 'confirmed' || status === 'in_progress') && isPast && (
                            <Button 
                              size="sm" 
                              onClick={() => handleMarkNoShow(appointment.id)}
                              disabled={updatingStatusId === appointment.id}
                              variant="outline"
                              className="border-orange-300 text-orange-700 hover:bg-orange-50"
                            >
                              {updatingStatusId === appointment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'No-Show'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
      </>

      {/* Reject Appointment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#01377D]">Reject Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this appointment. The patient will be notified to reschedule.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-[#97E7F5]">
              <p className="text-sm font-medium text-[#01377D]">
                {selectedAppointment.patient?.user?.name || 'Unknown Patient'}
              </p>
              <p className="text-xs text-gray-600">
                {selectedAppointment.start_time ? format(new Date(selectedAppointment.start_time), 'EEEE, MMMM d, yyyy • h:mm a') : 'N/A'}
              </p>
              <p className="text-xs text-gray-600">
                {getAppointmentTypeLabel(selectedAppointment)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-[#01377D]">Reason for Rejection *</Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g., Time slot no longer available, need to reschedule to different date..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] border-[#97E7F5] focus:border-[#009DD1]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedAppointment(null);
                setRejectReason('');
              }}
              disabled={rejectingId}
              className="border-[#97E7F5]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectAppointment}
              disabled={!rejectReason.trim() || rejectingId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {rejectingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;