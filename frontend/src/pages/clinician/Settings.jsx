import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { 
  User, 
  Bell, 
  Lock, 
  Calendar,
  Save,
  Loader2,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import StaffRoleBanner from '../../components/staff/StaffRoleBanner';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email_appointments: true,
    email_medcerts: true,
    email_messages: true,
    push_appointments: true,
    push_medcerts: false,
    push_messages: true,
    daily_summary: true,
    weekly_report: false
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    default_appointment_duration: '30',
    buffer_time: '15',
    max_daily_appointments: '20',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    start_time: '09:00',
    end_time: '17:00'
  });

  const handleGoToProfile = () => {
    navigate('/auth/profile');
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await updateNotificationSettings(notifications);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await updateScheduleSettings(scheduleSettings);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Schedule settings updated');
    } catch (error) {
      console.error('Error updating schedule settings:', error);
      toast.error('Failed to update schedule settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkingDay = (day) => {
    setScheduleSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day]
    }));
  };

  const workingDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="space-y-6">
      <StaffRoleBanner
        title="Clinician Settings"
        subtitle="Manage account preferences, schedule configuration, and notification behavior from one place."
        primaryAction={{ label: 'Open Schedule', to: '/clinician/schedule' }}
        secondaryAction={{ label: 'Request Management', to: '/clinician/requests' }}
      />

      <div>
        <h1 className="text-3xl font-bold text-[#01377D]">Settings</h1>
        <p className="text-[#009DD1] mt-2">Manage your profile and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="h-auto w-full flex-nowrap gap-1 overflow-x-auto rounded-xl border border-[#97E7F5] bg-white p-1">
          <TabsTrigger value="profile" title="Profile" className="min-w-[44px] px-3 py-2 data-[state=active]:bg-[#009DD1] data-[state=active]:text-white">
            <User className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" title="Notifications" className="min-w-[44px] px-3 py-2 data-[state=active]:bg-[#009DD1] data-[state=active]:text-white">
            <Bell className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" title="Schedule" className="min-w-[44px] px-3 py-2 data-[state=active]:bg-[#009DD1] data-[state=active]:text-white">
            <Calendar className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="security" title="Security" className="min-w-[44px] px-3 py-2 data-[state=active]:bg-[#009DD1] data-[state=active]:text-white">
            <Lock className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-[#97E7F5] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#01377D]">Account Overview</CardTitle>
              <CardDescription>
                Core personal details live in your unified profile page. Quick view below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#97E7F5] rounded-lg bg-white">
                  <Label className="text-xs uppercase text-gray-500">Full Name</Label>
                  <p className="text-lg font-semibold text-[#01377D] mt-1">{user?.name || '—'}</p>
                </div>
                <div className="p-4 border border-[#97E7F5] rounded-lg bg-white">
                  <Label className="text-xs uppercase text-gray-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#009DD1]" /> Email
                  </Label>
                  <p className="text-lg font-semibold text-[#01377D] mt-1">{user?.email || '—'}</p>
                </div>
                <div className="p-4 border border-[#97E7F5] rounded-lg bg-white">
                  <Label className="text-xs uppercase text-gray-500 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#009DD1]" /> Phone
                  </Label>
                  <p className="text-lg font-semibold text-[#01377D] mt-1">{user?.phone || user?.clinician?.phone || '—'}</p>
                </div>
                <div className="p-4 border border-[#97E7F5] rounded-lg bg-white">
                  <Label className="text-xs uppercase text-gray-500">Role</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className="bg-[#009DD1] text-white capitalize">
                      {user?.role || 'clinician'}
                    </Badge>
                    <span className="text-sm text-gray-500">Managed globally</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-dashed border-[#97E7F5] rounded-lg bg-[#F8FDFF]">
                <div>
                  <p className="text-sm font-semibold text-[#01377D]">Need to edit personal info or password?</p>
                  <p className="text-sm text-gray-600">Use the shared profile page so all roles stay in sync.</p>
                </div>
                <Button onClick={handleGoToProfile} className="bg-[#009DD1] hover:bg-[#01377D]">
                  Open Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-[#97E7F5] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#01377D]">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-[#01377D] mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-appointments" className="text-gray-700">Appointment updates</Label>
                    <Switch
                      id="email-appointments"
                      checked={notifications.email_appointments}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_appointments: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-medcerts" className="text-gray-700">Medical certificate requests</Label>
                    <Switch
                      id="email-medcerts"
                      checked={notifications.email_medcerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_medcerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-messages" className="text-gray-700">Messages and alerts</Label>
                    <Switch
                      id="email-messages"
                      checked={notifications.email_messages}
                      onCheckedChange={(checked) => setNotifications({...notifications, email_messages: checked})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#01377D] mb-4">Push Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-appointments" className="text-gray-700">Appointment reminders</Label>
                    <Switch
                      id="push-appointments"
                      checked={notifications.push_appointments}
                      onCheckedChange={(checked) => setNotifications({...notifications, push_appointments: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-medcerts" className="text-gray-700">Medical certificate requests</Label>
                    <Switch
                      id="push-medcerts"
                      checked={notifications.push_medcerts}
                      onCheckedChange={(checked) => setNotifications({...notifications, push_medcerts: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-messages" className="text-gray-700">New messages</Label>
                    <Switch
                      id="push-messages"
                      checked={notifications.push_messages}
                      onCheckedChange={(checked) => setNotifications({...notifications, push_messages: checked})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#01377D] mb-4">Reports</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="daily-summary" className="text-gray-700">Daily summary</Label>
                    <Switch
                      id="daily-summary"
                      checked={notifications.daily_summary}
                      onCheckedChange={(checked) => setNotifications({...notifications, daily_summary: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weekly-report" className="text-gray-700">Weekly report</Label>
                    <Switch
                      id="weekly-report"
                      checked={notifications.weekly_report}
                      onCheckedChange={(checked) => setNotifications({...notifications, weekly_report: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="bg-[#009DD1] hover:bg-[#01377D]"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Preferences</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card className="border-[#97E7F5] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#01377D]">Schedule Settings</CardTitle>
              <CardDescription>Configure your availability and appointment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-[#01377D]">Default Appointment Duration</Label>
                  <Select 
                    value={scheduleSettings.default_appointment_duration} 
                    onValueChange={(val) => setScheduleSettings({...scheduleSettings, default_appointment_duration: val})}
                  >
                    <SelectTrigger className="mt-1 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="buffer" className="text-[#01377D]">Buffer Time Between Appointments</Label>
                  <Select 
                    value={scheduleSettings.buffer_time} 
                    onValueChange={(val) => setScheduleSettings({...scheduleSettings, buffer_time: val})}
                  >
                    <SelectTrigger className="mt-1 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No buffer</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max-appointments" className="text-[#01377D]">Max Daily Appointments</Label>
                  <Input
                    id="max-appointments"
                    type="number"
                    value={scheduleSettings.max_daily_appointments}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, max_daily_appointments: e.target.value})}
                    className="mt-1 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#01377D] mb-3 block">Working Days</Label>
                <div className="grid grid-cols-7 gap-2">
                  {workingDays.map(day => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={scheduleSettings.working_days.includes(day.value) ? 'default' : 'outline'}
                      className={scheduleSettings.working_days.includes(day.value) 
                        ? 'bg-[#009DD1] hover:bg-[#01377D]'
                        : 'border-[#97E7F5] text-[#009DD1] hover:bg-blue-50'
                      }
                      onClick={() => toggleWorkingDay(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-[#01377D]">Working Hours Start</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={scheduleSettings.start_time}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, start_time: e.target.value})}
                    className="mt-1 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-[#01377D]">Working Hours End</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={scheduleSettings.end_time}
                    onChange={(e) => setScheduleSettings({...scheduleSettings, end_time: e.target.value})}
                    className="mt-1 border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveSchedule}
                  disabled={loading}
                  className="bg-[#009DD1] hover:bg-[#01377D]"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Save Settings</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-[#97E7F5] shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-[#01377D]">Security</CardTitle>
              <CardDescription>Password changes are centralized with your profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-dashed border-[#97E7F5] rounded-lg bg-[#F8FDFF]">
                <p className="text-sm text-gray-700">
                  For consistency across all user roles, password updates are handled in the main profile page. This ensures one source of truth for authentication changes.
                </p>
                <Button onClick={handleGoToProfile} className="mt-4 bg-[#009DD1] hover:bg-[#01377D]">
                  Manage Password in Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
