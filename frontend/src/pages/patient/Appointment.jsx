// Appointment.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Calendar, Clock, Loader2, MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getAppointments, createAppointment, cancelAppointment } from '../../api/Appointments';
import { getClinicMeta } from '../../api/Clinic';
import PatientRoleBanner from '../../components/patient/PatientRoleBanner';
import PatientAppointmentSkeleton from '../../components/patient/PatientAppointmentSkeleton';

const DEFAULT_OPEN = '08:00';
const DEFAULT_CLOSE = '17:00';
const DEFAULT_INTERVAL = 30;
const defaultForm = { appointmentTypeId: '', date: '', time: '', reason: '' };

const titleCase = (value = '') =>
  value
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const formatTimeSlot = (slot) => {
  try {
    return format(new Date(`1970-01-01T${slot}:00`), 'h:mm a');
  } catch (error) {
    return slot;
  }
};

const formatPricePhp = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return `PHP ${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const buildLocalDate = (dateStr, timeStr) => {
  console.log('buildLocalDate input:', { dateStr, timeStr });
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  console.log('buildLocalDate parsed:', { year, month, day, hours, minutes });
  const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
  console.log('buildLocalDate result:', result.toString(), result.toISOString());
  return result;
};

const formatForApi = (dateObj) => {
  const pad = (value) => String(value).padStart(2, '0');
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hours = pad(dateObj.getHours());
  const minutes = pad(dateObj.getMinutes());
  const seconds = pad(dateObj.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const generateTimeSlots = (openTime, closeTime, intervalMinutes) => {
  try {
    const slots = [];
    const start = new Date(`1970-01-01T${openTime}:00`);
    const end = new Date(`1970-01-01T${closeTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return [];
    }
    let pointer = new Date(start);
    while (pointer < end) {
      slots.push(pointer.toTimeString().slice(0, 5));
      pointer = new Date(pointer.getTime() + intervalMinutes * 60000);
    }
    return slots;
  } catch (error) {
    return [];
  }
};

const normalizeDate = (value) => {
  if (!value) return '';
  // If it's already YYYY-MM-DD format, return as-is
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  // If it's a UTC timestamp, convert to local date
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      // Get local date components
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Fallback to string slicing
  }
  return String(value).slice(0, 10);
};

const isTypeAvailableForDate = (type, dateValue) => {
  if (!type || type.is_active === false) return false;
  if (!dateValue) return true;

  const targetDate = normalizeDate(dateValue);
  const from = type.available_from ? normalizeDate(type.available_from) : '';
  const until = type.available_until ? normalizeDate(type.available_until) : '';

  if (from && targetDate < from) return false;
  if (until && targetDate > until) return false;

  const days = Array.isArray(type.available_days) ? type.available_days : [];
  if (days.length > 0) {
    const dayKey = format(new Date(targetDate), 'eee').slice(0, 3).toLowerCase();
    if (!days.includes(dayKey)) return false;
  }

  return true;
};

const isTypeAvailableForTime = (type, dateValue, timeValue, durationMinutes) => {
  if (!timeValue || !type?.available_start_time || !type?.available_end_time || !dateValue) return true;

  const start = buildLocalDate(dateValue, timeValue);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const startBoundary = new Date(`${dateValue}T${String(type.available_start_time).slice(0, 5)}:00`);
  const endBoundary = new Date(`${dateValue}T${String(type.available_end_time).slice(0, 5)}:00`);
  return start >= startBoundary && end <= endBoundary;
};

const getStatusStyles = (status = '') => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'no_show':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const Appointment = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [formData, setFormData] = useState(defaultForm);
  const [cancelDialog, setCancelDialog] = useState({ open: false, appointment: null, reason: '', submitting: false });
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [clinicSettings, setClinicSettings] = useState(null);
  const [closures, setClosures] = useState([]);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
    loadClinicMeta();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await getAppointments({ per_page: 50 });
      const payload = response?.data;
      const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
      setAppointments(list);
    } catch (error) {
      console.error('Failed to load appointments', error);
      toast.error('Unable to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicMeta = async () => {
    try {
      setConfigLoading(true);
      const response = await getClinicMeta();
      console.log('✅ Clinic meta loaded successfully');
      const data = response?.data?.data || {};
      setClinicSettings(data.settings || null);
      setClosures(Array.isArray(data.closures) ? data.closures : []);
      setAppointmentTypes(
        Array.isArray(data.appointment_types)
          ? data.appointment_types.filter((type) => type.is_active !== false)
          : []
      );
    } catch (error) {
      console.error('Failed to load clinic configuration:', {
        status: error?.response?.status,
        message: error?.message,
      });
      // Set defaults so dialog still works
      setClinicSettings(null);
      setClosures([]);
      setAppointmentTypes([]);
    } finally {
      setConfigLoading(false);
    }
  };

  const pendingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => {
        const start = new Date(appointment.start_time);
        const status = (appointment.status || '').toLowerCase();
        return start >= now && status === 'scheduled';
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [appointments]);

  const confirmedAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => {
        const start = new Date(appointment.start_time);
        const status = (appointment.status || '').toLowerCase();
        return start >= now && ['confirmed', 'in_progress'].includes(status);
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [appointments]);

  const completedAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const status = (appointment.status || '').toLowerCase();
        return status === 'completed';
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [appointments]);

  const noShowAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((appointment) => {
        const start = new Date(appointment.start_time);
        const status = (appointment.status || '').toLowerCase();
        return start < now && status === 'no_show';
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [appointments]);

  const cancelledAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const status = (appointment.status || '').toLowerCase();
        return status === 'cancelled';
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [appointments]);

  const rejectedAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const status = (appointment.status || '').toLowerCase();
        return status === 'rejected';
      })
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [appointments]);

  const resetForm = () => setFormData(defaultForm);

  const selectedType = useMemo(
    () => appointmentTypes.find((type) => String(type.id) === String(formData.appointmentTypeId)),
    [appointmentTypes, formData.appointmentTypeId]
  );

  const availableAppointmentTypes = useMemo(() => {
    return appointmentTypes.filter((type) => isTypeAvailableForDate(type, formData.date));
  }, [appointmentTypes, formData.date]);

  const serviceDuration = selectedType?.estimated_minutes || clinicSettings?.appointment_interval || DEFAULT_INTERVAL;
  const clinicOpen = clinicSettings?.open_time || DEFAULT_OPEN;
  const clinicClose = clinicSettings?.close_time || DEFAULT_CLOSE;
  const clinicInterval = clinicSettings?.appointment_interval || DEFAULT_INTERVAL;

  const baseTimeSlots = useMemo(
    () => {
      const generated = generateTimeSlots(clinicOpen, clinicClose, clinicInterval);
      if (generated.length === 0) {
        return generateTimeSlots(DEFAULT_OPEN, DEFAULT_CLOSE, DEFAULT_INTERVAL);
      }
      return generated;
    },
    [clinicOpen, clinicClose, clinicInterval]
  );

  const workingDaysSet = useMemo(() => {
    const days = clinicSettings?.working_days;
    return new Set(Array.isArray(days) ? days : []);
  }, [clinicSettings]);

  const getClosuresForDate = (dateValue) => {
    const target = normalizeDate(dateValue);
    if (!target) return [];
    const matched = closures.filter((closure) => {
      const closureDate = normalizeDate(closure.date);
      console.log('Closure date comparison:', { 
        rawClosureDate: closure.date, 
        normalizedClosureDate: closureDate, 
        target,
        matches: closureDate === target 
      });
      return closureDate === target;
    });
    console.log('getClosuresForDate:', { dateValue, target, closures, matched });
    return matched;
  };

  const hasFullDayClosure = (dateValue) =>
    getClosuresForDate(dateValue).some((closure) => !closure.start_time && !closure.end_time);

  const isWorkingDay = (dateValue) => {
    if (!dateValue || workingDaysSet.size === 0) return true;
    try {
      const dayKey = format(new Date(dateValue), 'eee').slice(0, 3).toLowerCase();
      return workingDaysSet.has(dayKey);
    } catch (error) {
      return false;
    }
  };

  const isDateSelectable = (dateValue) => isWorkingDay(dateValue) && !hasFullDayClosure(dateValue);

  const filteredTimeOptions = useMemo(() => {
    if (!formData.date) return baseTimeSlots;
    
    // Get closures for the selected date (exclude full-day closures as they prevent date selection entirely)
    const closuresForDay = getClosuresForDate(formData.date)
      .filter((closure) => closure.start_time && closure.end_time) // Only partial-day closures
      .map((closure) => {
        // Ensure time format is HH:MM or HH:MM:SS
        const startTime = closure.start_time.length === 5 ? `${closure.start_time}:00` : closure.start_time;
        const endTime = closure.end_time.length === 5 ? `${closure.end_time}:00` : closure.end_time;
        return {
          start: new Date(`${formData.date}T${startTime}`),
          end: new Date(`${formData.date}T${endTime}`),
          raw: closure
        };
      });
    
    if (closuresForDay.length > 0) {
      console.log('Closures affecting time slots on', formData.date, ':', closuresForDay);
    }

    // Get existing appointments for the selected date (only confirmed, in_progress, and completed block slots)
    const appointmentsOnDay = appointments.filter((apt) => {
      if (!apt.start_time) return false;
      const aptDate = normalizeDate(apt.start_time);
      const selectedDate = normalizeDate(formData.date);
      const status = (apt.status || '').toLowerCase();
      // Only confirmed, in_progress, and completed appointments block time slots
      // Pending (scheduled), rejected, cancelled, and no_show do NOT block slots
      return aptDate === selectedDate && (status === 'confirmed' || status === 'in_progress' || status === 'completed');
    }).map((apt) => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      // Add buffer interval after appointment ends
      const aptEndWithBuffer = new Date(aptEnd.getTime() + clinicInterval * 60000);
      return { start: aptStart, end: aptEndWithBuffer };
    });

    return baseTimeSlots.filter((slot) => {
      const slotStart = new Date(`${formData.date}T${slot}:00`);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      const closeBoundary = new Date(`${formData.date}T${clinicClose}:00`);
      
      // Check if slot is valid time
      if (Number.isNaN(slotStart.getTime()) || slotEnd > closeBoundary) return false;
      
      // Check if slot conflicts with closures
      const noClosureConflict = closuresForDay.every((window) => 
        slotEnd <= window.start || slotStart >= window.end
      );
      
      // Check if slot conflicts with existing appointments
      const noAppointmentConflict = appointmentsOnDay.every((apt) => 
        slotEnd <= apt.start || slotStart >= apt.end
      );

      const matchesServiceTime = isTypeAvailableForTime(selectedType, formData.date, slot, serviceDuration);

      return noClosureConflict && noAppointmentConflict && matchesServiceTime;
    });
  }, [baseTimeSlots, clinicClose, formData.date, serviceDuration, closures, appointments, selectedType]);

  const handleDateChange = (value) => {
    if (!value) {
      setFormData((prev) => ({ ...prev, date: '', time: '' }));
      return;
    }

    if (!isDateSelectable(value)) {
      toast.error('Clinic is closed on the selected day');
      return;
    }

    setFormData((prev) => {
      const next = { ...prev, date: value, time: '' };
      if (prev.appointmentTypeId) {
        const currentType = appointmentTypes.find((type) => String(type.id) === String(prev.appointmentTypeId));
        if (currentType && !isTypeAvailableForDate(currentType, value)) {
          next.appointmentTypeId = '';
          toast.error('Selected service is not available on that date.');
        }
      }
      return next;
    });
  };

  const handleBookAppointment = async () => {
    if (!formData.date || !formData.time || !formData.appointmentTypeId) {
      toast.error('Please complete all required fields');
      return;
    }

    if (!selectedType) {
      toast.error('Selected appointment type is no longer available. Please refresh.');
      return;
    }

    if (!isTypeAvailableForDate(selectedType, formData.date) || !isTypeAvailableForTime(selectedType, formData.date, formData.time, serviceDuration)) {
      toast.error('Selected service is not available on the chosen date/time.');
      return;
    }

    try {
      setBooking(true);
      const startTime = buildLocalDate(formData.date, formData.time);
      const endTime = new Date(startTime.getTime() + serviceDuration * 60000);
      
      // Double-check for conflicts with current appointment data
      const hasConflict = appointments.some((apt) => {
        if (!apt.start_time) return false;
        const aptDate = normalizeDate(apt.start_time);
        const selectedDate = normalizeDate(formData.date);
        const status = (apt.status || '').toLowerCase();
        
        if (aptDate !== selectedDate || status === 'cancelled') return false;
        
        const aptStart = new Date(apt.start_time);
        const aptEnd = new Date(apt.end_time);
        
        // Check if times overlap
        return !(endTime <= aptStart || startTime >= aptEnd);
      });
      
      if (hasConflict) {
        toast.error('This time slot is no longer available. Please choose another time.');
        setBooking(false);
        return;
      }
      
      const typeName = selectedType.name;

      const payload = {
        appointment_type_id: Number(formData.appointmentTypeId),
        title: typeName,
        type: typeName,
        description: formData.reason,
        start_time: formatForApi(startTime),
        end_time: formatForApi(endTime),
        location: 'Campus Clinic',
      };

      console.log('Booking appointment:', {
        serviceDuration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        formatted_start: payload.start_time,
        formatted_end: payload.end_time,
        duration_minutes: (endTime - startTime) / 60000,
      });

      await createAppointment(payload);

      toast.success('Appointment request submitted! Waiting for clinic confirmation.');
      setDialogOpen(false);
      resetForm();
      loadAppointments();
    } catch (error) {
      console.error('Failed to create appointment', error);
      const message = error?.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  const openCancelDialog = (appointment) => {
    setCancelDialog({ open: true, appointment, reason: '', submitting: false });
  };

  const handleCancelAppointment = async () => {
    if (!cancelDialog.reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (!cancelDialog.appointment?.id) {
      toast.error('No appointment selected');
      return;
    }

    try {
      setCancelDialog((prev) => ({ ...prev, submitting: true }));
      const response = await cancelAppointment(cancelDialog.appointment.id, cancelDialog.reason.trim());
      console.log('Cancel appointment response:', response);
      
      toast.success('Appointment cancelled successfully');
      
      // Close dialog first
      setCancelDialog({ open: false, appointment: null, reason: '', submitting: false });
      
      // Small delay to ensure backend state is consistent, then reload
      setTimeout(() => {
        loadAppointments();
      }, 300);
    } catch (error) {
      console.error('Failed to cancel appointment', error);
      const message = error?.response?.data?.message || 'Unable to cancel appointment';
      toast.error(message);
      setCancelDialog((prev) => ({ ...prev, submitting: false }));
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const bookingDisabled = booking || configLoading || appointmentTypes.length === 0;
  const cardClass =
    'border-[#D8EBFA] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(2,132,199,0.12)]';
  const tabClass = (value) =>
    `rounded-full border px-4 text-xs sm:text-sm ${
      activeTab === value
        ? 'border-[#BFE6FB] bg-[#EAF5FF] text-[#0f2d57]'
        : 'border-[#D8EBFA] bg-white text-[#5A6F8F] hover:bg-[#F8FBFF] hover:text-[#0f2d57]'
    }`;

  if (loading) {
    return <PatientAppointmentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PatientRoleBanner
        title="Appointments"
        subtitle="Book, manage, and monitor your appointment requests with quick status tracking."
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#0f2d57]">Manage Your Appointments</h1>
          <p className="mt-1 text-sm text-[#406A93]">Book a new visit or review your appointment timeline.</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex w-full items-center justify-center gap-2 bg-[#0ea5e9] text-white hover:bg-[#0284c7] sm:w-auto" disabled={configLoading}>
              {configLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Book Appointment
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white duration-300 ease-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.98] data-[state=closed]:slide-out-to-bottom-2 data-[state=closed]:duration-200 data-[state=closed]:ease-in">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Choose a service, date, and time to submit your appointment request.
              </DialogDescription>
            </DialogHeader>
            {configLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#009DD1]" />
              </div>
            ) : (
              <div className="space-y-4">
                {appointmentTypes.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm p-3 rounded">
                    No appointment types are configured yet. Please contact the clinic administrator.
                  </div>
                )}

                <div className="p-3 rounded border border-dashed border-[#97E7F5] bg-[#f8fafc] text-sm text-[#01377D]">
                  Your appointment will be reviewed and confirmed by clinic staff.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment-type">Appointment Type *</Label>
                  <Select 
                    value={formData.appointmentTypeId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, appointmentTypeId: value, time: '' }))}
                    disabled={availableAppointmentTypes.length === 0}
                  >
                    <SelectTrigger id="appointment-type" >
                      <SelectValue  placeholder={availableAppointmentTypes.length ? 'Choose a visit type' : 'No services available'} />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-50">
                      {availableAppointmentTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                          {type.estimated_minutes ? ` • ${type.estimated_minutes} mins` : ''}
                          {formatPricePhp(type.price) ? ` • ${formatPricePhp(type.price)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.date && availableAppointmentTypes.length === 0 && (
                    <p className="text-xs text-red-600">No services configured for this date.</p>
                  )}
                  {selectedType && formatPricePhp(selectedType.price) && (
                    <p className="text-xs text-[#0f2d57]">Selected service price: <span className="font-semibold">{formatPricePhp(selectedType.price)}</span></p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      min={today}
                      value={formData.date}
                      onChange={(event) => handleDateChange(event.target.value)}
                    />
                    {formData.date && getClosuresForDate(formData.date).filter(c => c.start_time && c.end_time).length > 0 && (
                      <p className="text-xs text-amber-600">
                        ⚠️ Partial closure on this date
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, time: value }))}
                      disabled={!formData.date || filteredTimeOptions.length === 0}
                    >
                      <SelectTrigger id="time">
                        <SelectValue
                          placeholder={
                            !formData.date
                              ? 'Select a date first'
                              : filteredTimeOptions.length === 0
                                ? 'No slots available'
                                : 'Choose time'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-50">
                        {filteredTimeOptions.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {formatTimeSlot(slot)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.date && filteredTimeOptions.length === 0 && (
                      <p className="text-xs text-red-600">No open slots for this day. Please pick another date.</p>
                    )}
                    {formData.date && filteredTimeOptions.length > 0 && (
                      <p className="text-xs text-green-600">{filteredTimeOptions.length} available slot{filteredTimeOptions.length !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason / Notes</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe your symptoms or reason for visit..."
                    value={formData.reason}
                    onChange={(event) => setFormData((prev) => ({ ...prev, reason: event.target.value }))}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={handleBookAppointment}
                className="border-2 border-[#01377D] bg-[#009DD1] text-white hover:bg-[#007ea8]"
                disabled={bookingDisabled}
              >
                {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-transparent gap-2 flex-wrap p-1">
          <TabsTrigger value="pending" className={tabClass('pending')}>
            Pending ({pendingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className={tabClass('confirmed')}>
            Confirmed ({confirmedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className={tabClass('completed')}>
            Completed ({completedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="no-show" className={tabClass('no-show')}>
            No Show ({noShowAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className={tabClass('cancelled')}>
            Cancelled ({cancelledAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className={tabClass('rejected')}>
            Rejected ({rejectedAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : pendingAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                You have no pending appointments awaiting confirmation.
              </CardContent>
            </Card>
          ) : (
            pendingAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-[#01377D]" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        {appointment.status?.toLowerCase() === 'scheduled' && (
                          <div className="mt-3 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded">
                            ⏳ Waiting for clinic confirmation
                          </div>
                        )}
                        {appointment.status?.toLowerCase() === 'in_progress' && (
                          <div className="mt-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded">
                            🏥 Appointment in progress
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                        {titleCase(appointment.status)}
                      </Badge>
                      {appointment.status?.toLowerCase() !== 'in_progress' && (
                        <Button variant="ghost" size="sm" onClick={() => openCancelDialog(appointment)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : confirmedAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                You have no confirmed appointments.
              </CardContent>
            </Card>
          ) : (
            confirmedAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        {appointment.status?.toLowerCase() === 'in_progress' && (
                          <div className="mt-3 text-xs bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded">
                            🏥 Appointment in progress
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                        {titleCase(appointment.status)}
                      </Badge>
                      {appointment.status?.toLowerCase() !== 'in_progress' && (
                        <Button variant="ghost" size="sm" onClick={() => openCancelDialog(appointment)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : completedAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No past appointments recorded yet.
              </CardContent>
            </Card>
          ) : (
            completedAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        {appointment.status?.toLowerCase() === 'cancelled' && appointment.cancellation_reason && (
                          <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-800 p-2 rounded">
                            <strong>Reason:</strong> {appointment.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                      {titleCase(appointment.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="no-show" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : noShowAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No missed appointments recorded.
              </CardContent>
            </Card>
          ) : (
            noShowAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        <div className="mt-3 text-xs bg-orange-50 border border-orange-200 text-orange-800 p-2 rounded">
                          ⚠️ Appointment was not attended
                        </div>
                      </div>
                    </div>
                    <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                      {titleCase(appointment.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : cancelledAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No cancelled appointments.
              </CardContent>
            </Card>
          ) : (
            cancelledAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        {appointment.status?.toLowerCase() === 'cancelled' && appointment.cancellation_reason && (
                          <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-800 p-2 rounded">
                            <strong>Reason:</strong> {appointment.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                      {titleCase(appointment.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 pt-1 sm:pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#009DD1]" />
            </div>
          ) : rejectedAppointments.length === 0 ? (
            <Card className={cardClass}>
              <CardContent className="py-10 text-center text-gray-500">
                No rejected appointments.
              </CardContent>
            </Card>
          ) : (
            rejectedAppointments.map((appointment) => (
              <Card key={appointment.id} className={cardClass}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <Calendar className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-[#01377D] text-lg font-semibold">
                          {appointment.type || 'Clinic Visit'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.title || 'Clinic Appointment'}
                        </p>
                        <div className="text-sm text-gray-500 space-y-1 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {appointment.location || 'Campus Clinic'}
                          </div>
                        </div>
                        {appointment.cancellation_reason && (
                          <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-800 p-2 rounded">
                            <strong>Reason:</strong> {appointment.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`capitalize border ${getStatusStyles(appointment.status)}`}>
                      {titleCase(appointment.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialog({ open: false, appointment: null, reason: '', submitting: false });
          } else {
            setCancelDialog((prev) => ({ ...prev, open: true }));
          }
        }}
      >
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Provide a quick reason so we can notify the clinic.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {cancelDialog.appointment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-[#01377D] font-medium">
                  {cancelDialog.appointment.title || 'Clinic Appointment'}
                </p>
                <p className="text-xs text-gray-600">
                  {cancelDialog.appointment.type || 'Visit'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  {cancelDialog.appointment.start_time 
                    ? format(new Date(cancelDialog.appointment.start_time), 'EEEE, MMM d, yyyy • h:mm a')
                    : 'Date/time not available'
                  }
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-[#01377D] font-medium">Reason for Cancellation *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please tell us why you're cancelling this appointment..."
                value={cancelDialog.reason}
                onChange={(event) => setCancelDialog((prev) => ({ ...prev, reason: event.target.value }))}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, appointment: null, reason: '', submitting: false })}
              disabled={cancelDialog.submitting}
              className="border-gray-300"
            >
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelAppointment} 
              disabled={cancelDialog.submitting || !cancelDialog.reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelDialog.submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointment;
