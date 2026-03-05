// Settings.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, Eye, EyeOff, Clock, FileText, Sparkles, Pencil, Power, Trash2 } from 'lucide-react';
import {
  getClinicSettings,
  saveClinicSettings,
  listClinicClosures,
  addClinicClosure,
  deleteClinicClosure,
} from '../../api/Clinic';
import { getMailSettings, saveMailSettings } from '../../api/Mail';
import { listAppointmentTypes, addAppointmentType, deleteAppointmentType, updateAppointmentType } from '../../api/AppointmentTypes';
import { listMedcertReasons, addMedcertReason, deleteMedcertReason, updateMedcertReason } from '../../api/MedcertReasons';
import { listDocumentTypes, addDocumentType, deleteDocumentType, updateDocumentType, toggleDocumentTypeStatus } from '../../api/DocumentTypes';
import { toast } from 'sonner';
import AdminPageSkeleton from '../../components/admin/AdminPageSkeleton';
import { useBranding } from '../../contexts/BrandingContext';

export const Settings = () => {
  const { reloadBranding, applyBrandingFromSettings } = useBranding();
  const [initialLoading, setInitialLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);

  // Mail (SMTP) settings state (single editable mail account)
  const [smtpEmail, setSmtpEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpEncryption, setSmtpEncryption] = useState('tls');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully');
  };

  // Clinic settings state
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');
  const [workingDays, setWorkingDays] = useState(['mon','tue','wed','thu','fri']);
  const [appointmentInterval, setAppointmentInterval] = useState(15); // minutes
  const [brandName, setBrandName] = useState('');
  const [brandShortName, setBrandShortName] = useState('');
  const [systemTitle, setSystemTitle] = useState('');
  const [systemSubtitle, setSystemSubtitle] = useState('');
  const [footerDescription, setFooterDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [removeBrandLogo, setRemoveBrandLogo] = useState(false);

  // Closures state
  const [closureDate, setClosureDate] = useState('');
  const [closureStart, setClosureStart] = useState('');
  const [closureEnd, setClosureEnd] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [closures, setClosures] = useState([]);
  const [showClosureModal, setShowClosureModal] = useState(false);

  const loadClinicData = async () => {
    try {
      const s = await getClinicSettings();
      const settings = s.data?.data?.settings || s.data?.data || s.data?.settings || null;
      if (settings) {
        if (settings.open_time) setOpenTime(settings.open_time.slice(0,5));
        if (settings.close_time) setCloseTime(settings.close_time.slice(0,5));
        if (settings.working_days) setWorkingDays(settings.working_days);
        if (settings.appointment_interval) setAppointmentInterval(Number(settings.appointment_interval));
        setBrandName(settings.brand_name || '');
        setBrandShortName(settings.brand_short_name || '');
        setSystemTitle(settings.system_title || '');
        setSystemSubtitle(settings.system_subtitle || '');
        setFooterDescription(settings.footer_description || '');
        setContactEmail(settings.contact_email || '');
        setContactPhone(settings.contact_phone || '');
        setBrandLogoUrl(settings.brand_logo_url || '');
        setBrandLogoFile(null);
        setRemoveBrandLogo(false);
      }

      const c = await listClinicClosures();
      const list = c.data?.data?.closures || c.data?.data || c.data?.closures || [];
      setClosures(list || []);
      // load mail settings
      try {
        const m = await getMailSettings();
        const ms = m.data?.data?.settings || m.data?.data || m.data?.settings || null;
        if (ms) {
          if (ms.email) setSmtpEmail(ms.email);
          if (ms.password) setSmtpPassword(ms.password);
          if (ms.host) setSmtpHost(ms.host);
          if (ms.port) setSmtpPort(ms.port);
          if (ms.encryption) setSmtpEncryption(ms.encryption);
        }
      } catch (e) {
        // non-fatal
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clinic data');
    }
  };

  const toggleDay = (day) => {
    setWorkingDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      return [...prev, day];
    });
  };

  const handleSaveClinic = async () => {
    try {
      const payload = new FormData();
      payload.append('open_time', openTime);
      payload.append('close_time', closeTime);
      payload.append('appointment_interval', String(appointmentInterval));
      workingDays.forEach((day, index) => payload.append(`working_days[${index}]`, day));
      payload.append('brand_name', brandName || '');
      payload.append('brand_short_name', brandShortName || '');
      payload.append('system_title', systemTitle || '');
      payload.append('system_subtitle', systemSubtitle || '');
      payload.append('footer_description', footerDescription || '');
      payload.append('contact_email', contactEmail || '');
      payload.append('contact_phone', contactPhone || '');
      if (brandLogoFile) {
        payload.append('brand_logo', brandLogoFile);
      }
      if (removeBrandLogo) {
        payload.append('remove_brand_logo', '1');
      }

      const res = await saveClinicSettings(payload);
      toast.success('Clinic settings saved');
      const refreshed = res.data?.data?.settings || res.data?.settings || null;
      if (refreshed) {
        applyBrandingFromSettings(refreshed);
      }
      if (refreshed?.brand_logo_url !== undefined) {
        setBrandLogoUrl(refreshed.brand_logo_url || '');
      }
      setBrandLogoFile(null);
      setRemoveBrandLogo(false);
      await reloadBranding();
      if (res.data?.data?.settings) {
        // update local state if needed
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save clinic settings');
    }
  };

  const handleAddClosure = async () => {
    if (!closureDate) {
      toast.error('Please choose a date for closure');
      return;
    }
    try {
      const payload = {
        date: closureDate,
        start_time: closureStart || null,
        end_time: closureEnd || null,
        reason: closureReason || null,
      };
      const res = await addClinicClosure(payload);
      toast.success('Closure added');
      setClosureDate(''); setClosureStart(''); setClosureEnd(''); setClosureReason('');
      await loadClinicData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add closure');
    }
  };

  const handleDeleteClosure = async (id) => {
    try {
      await deleteClinicClosure(id);
      toast.success('Closure removed');
      await loadClinicData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove closure');
    }
  };

  const handleReload = async () => {
    await loadClinicData();
    toast.success('Reloaded');
  };

  const handleSaveInterval = async () => {
    try {
      await saveClinicSettings({ appointment_interval: appointmentInterval });
      toast.success('Appointment interval saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save interval');
    }
  };

  // Appointment types state
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [modalTypeName, setModalTypeName] = useState('');
  const [modalTypeCategory, setModalTypeCategory] = useState('');
  const [modalTypeDuration, setModalTypeDuration] = useState(30);
  const [modalTypePrice, setModalTypePrice] = useState('');
  const [modalTypeDescription, setModalTypeDescription] = useState('');
  const [modalTypeActive, setModalTypeActive] = useState(true);
  const [modalTypeAvailableFrom, setModalTypeAvailableFrom] = useState('');
  const [modalTypeAvailableUntil, setModalTypeAvailableUntil] = useState('');
  const [modalTypeDays, setModalTypeDays] = useState([]);
  const [modalTypeStartTime, setModalTypeStartTime] = useState('');
  const [modalTypeEndTime, setModalTypeEndTime] = useState('');
  const [showTypeViewModal, setShowTypeViewModal] = useState(false);
  const [viewingType, setViewingType] = useState(null);
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 10;

  const weekdayOptions = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const modalBackdropClass =
    'fixed inset-0 z-[9999] grid place-items-center bg-slate-900/55 p-4';
  const modalPanelClass =
    'w-full max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl border border-[#CFE5F7] bg-white p-6 sm:p-7 shadow-[0_24px_65px_rgba(2,32,71,0.34)]';

  const ModalPortal = ({ children }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  // MedCert reasons state
  const [reasons, setReasons] = useState([]);
  const [newReason, setNewReason] = useState('');
  // Reason modal / edit
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [modalReasonText, setModalReasonText] = useState('');

  // Document types state
  const [documentTypes, setDocumentTypes] = useState([]);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [modalDocTypeName, setModalDocTypeName] = useState('');
  const [modalDocTypeActive, setModalDocTypeActive] = useState(true);

  const loadAppointmentTypesAndReasons = async () => {
    try {
      const s = await listAppointmentTypes();
      const list = s.data?.data?.appointment_types || s.data?.data || s.data?.appointment_types || [];
      setAppointmentTypes(list || []);
    } catch (err) {
      console.error(err);
    }

    try {
      const r = await listMedcertReasons();
      const rr = r.data?.data?.reasons || r.data?.data?.types || r.data?.data || r.data?.reasons || [];
      setReasons(Array.isArray(rr) ? rr : []);
    } catch (err) {
      console.error(err);
    }

    try {
      const d = await listDocumentTypes();
      const dd = d.data?.data?.document_types || d.data?.data || d.data?.document_types || [];
      setDocumentTypes(Array.isArray(dd) ? dd : []);
    } catch (err) {
      console.error('Failed to load document types:', err);
    }
  };

  useEffect(() => {
    const bootstrapSettings = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([loadClinicData(), loadAppointmentTypesAndReasons()]);
      } finally {
        setInitialLoading(false);
      }
    };

    bootstrapSettings();
  }, []);

  const handleDeleteAppointmentType = async (id) => {
    try {
      await deleteAppointmentType(id);
      toast.success('Appointment type removed');
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove appointment type');
    }
  };

  const handleToggleAppointmentTypeStatus = async (type) => {
    try {
      await updateAppointmentType(type.id, { is_active: !type.is_active });
      toast.success(`Appointment type ${type.is_active ? 'deactivated' : 'activated'}`);
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const totalServicesPages = Math.max(1, Math.ceil(appointmentTypes.length / servicesPerPage));
  const servicesStartIndex = (servicesPage - 1) * servicesPerPage;
  const paginatedAppointmentTypes = appointmentTypes.slice(
    servicesStartIndex,
    servicesStartIndex + servicesPerPage
  );

  useEffect(() => {
    setServicesPage(1);
  }, [appointmentTypes.length]);

  useEffect(() => {
    if (servicesPage > totalServicesPages) {
      setServicesPage(totalServicesPages);
    }
  }, [servicesPage, totalServicesPages]);

  const handleAddReason = async () => {
    if (!newReason) return toast.error('Reason required');
    try {
      await addMedcertReason({ reason: newReason });
      toast.success('Reason added');
      setNewReason('');
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add reason');
    }
  };

  const handleDeleteReason = async (id) => {
    try {
      await deleteMedcertReason(id);
      toast.success('Reason removed');
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove reason');
    }
  };

  const handleDeleteDocType = async (id) => {
    try {
      await deleteDocumentType(id);
      toast.success('Document type removed');
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove document type');
    }
  };

  const handleToggleDocTypeStatus = async (docType) => {
    try {
      await toggleDocumentTypeStatus(docType.id, !docType.is_active);
      toast.success(`Document type ${docType.is_active ? 'deactivated' : 'activated'}`);
      await loadAppointmentTypesAndReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  if (initialLoading) {
    return <AdminPageSkeleton variant="tabs" rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm md:flex md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          Settings panel
        </div>
        <p className="text-xs text-slate-500">System-wide configuration controls</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-5 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-20 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
        <h2 className="text-2xl font-semibold">System Settings</h2>
        <p className="max-w-2xl text-sm text-cyan-100/90">Control clinic operations, booking rules, and available services in one modern settings hub.</p>
      </div>

      <Tabs defaultValue="email" className="space-y-1">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex sm:flex-wrap sm:justify-start">
          <TabsTrigger
            value="email"
            aria-label="Email"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <Mail className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger
            value="clinic"
            aria-label="Clinic Hours"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <SettingsIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Clinic Hours</span>
          </TabsTrigger>
          <TabsTrigger
            value="appointment-types"
            aria-label="Services"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <Database className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger
            value="scheduling"
            aria-label="Booking Interval"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Booking Interval</span>
          </TabsTrigger>
          <TabsTrigger
            value="medcert"
            aria-label="MedCert Types"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <Shield className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">MedCert Types</span>
          </TabsTrigger>
          <TabsTrigger
            value="document-types"
            aria-label="Document Types"
            className="min-h-10 px-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Document Types</span>
          </TabsTrigger>
        </TabsList>
        {/* Email (SMTP) Settings (header button + modal) */}
        <TabsContent value="email" className="space-y-4 bg-white">
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <Mail className="w-5 h-5 text-[#009DD1]" />
                  Email (SMTP)
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Configure SMTP account used by the application (Gmail SMTP supported)</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Button onClick={() => setShowEmailModal(true)} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">{smtpEmail ? 'Edit' : 'Add'}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {smtpEmail ? (
                <div className="bg-[#f8fafc] p-4 rounded">
                  <div className="text-sm text-[#01377D] font-medium">Configured Account</div>
                  <div className="text-[#009DD1]">{smtpEmail}</div>
                  <div className="text-xs text-[#01377D]">{smtpHost}:{smtpPort} • {smtpEncryption?.toUpperCase()}</div>
                </div>
              ) : (
                <div className="text-sm text-[#01377D]">No SMTP account configured. Click Add to configure.</div>
              )}
            </CardContent>
          </Card>

          {showEmailModal && (
            <ModalPortal>
              <div className={modalBackdropClass}>
                <div className={`${modalPanelClass} max-w-2xl`}>
                  <h3 className="text-xl font-semibold mb-1 text-[#01377D]">{smtpEmail ? 'Edit SMTP Account' : 'Add SMTP Account'}</h3>
                  <p className="text-sm text-[#4A6A8F] mb-4">Configure mail sender credentials used for system notifications.</p>
                  <div className="space-y-2">
                    <Label className="text-sm">Email (Gmail account)</Label>
                    <Input value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label className="text-sm">App Password</Label>
                    <div className="relative">
                      <Input type={showSmtpPassword ? 'text' : 'password'} value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowSmtpPassword((v) => !v)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#009DD1] p-1">
                        {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use a Gmail App Password (recommended) if your account has 2FA.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm">SMTP Host</Label>
                      <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">SMTP Port</Label>
                      <Input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Encryption</Label>
                      <Select value={smtpEncryption} onValueChange={setSmtpEncryption}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancel</Button>
                    <Button onClick={async () => {
                      try {
                        const res = await saveMailSettings({
                          email: smtpEmail,
                          password: smtpPassword,
                          host: smtpHost,
                          port: smtpPort,
                          encryption: smtpEncryption,
                        });
                        if (res?.data?.success) {
                          toast.success(res.data.message || 'Mail settings saved');
                          setSmtpPassword('');
                          setShowEmailModal(false);
                        } else {
                          const msg = res?.data?.error || res?.data?.message || 'Failed to save mail settings';
                          toast.error(msg);
                        }
                      } catch (err) {
                        console.error(err);
                        const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message;
                        toast.error(serverMsg || 'Failed to save mail settings');
                      }
                    }} className="bg-[#009DD1] hover:bg-[#007bb0] text-white">Save</Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </TabsContent>

        {/* Additional tabs defined below */}

        {/* Clinic Closures (show only closures, add via modal) */}
        <TabsContent value="clinic" className="space-y-4 bg-white">
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <SettingsIcon className="w-5 h-5 text-[#009DD1]" />
                  Clinic Hours
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Manage clinic hours, branding, and closure exceptions</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto">
                  <Button onClick={handleSaveClinic} className="w-full bg-[#01377D] text-white hover:bg-[#012b55] sm:w-auto">Save Changes</Button>
                  <Button onClick={() => setShowClosureModal(true)} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Closure</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-[#01377D]">Clinic Hours & Branding</h4>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm">Opening Time</Label>
                    <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Closing Time</Label>
                    <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Appointment Interval (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={appointmentInterval}
                      onChange={(e) => setAppointmentInterval(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Regular Working Days</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded px-3 py-1 text-xs ${
                          workingDays.includes(d) ? 'bg-[#01377D] text-white' : 'bg-[#97E7F5] text-[#01377D]'
                        }`}
                      >
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm">Header Name</Label>
                    <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Short Name</Label>
                    <Input value={brandShortName} onChange={(e) => setBrandShortName(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">System Title</Label>
                    <Input value={systemTitle} onChange={(e) => setSystemTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">System Subtitle</Label>
                    <Input value={systemSubtitle} onChange={(e) => setSystemSubtitle(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm">Footer Description</Label>
                    <Input value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Contact Email</Label>
                    <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Contact Phone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Logo (optional)</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setBrandLogoFile(e.target.files?.[0] || null)}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="remove-brand-logo-inline"
                      type="checkbox"
                      checked={removeBrandLogo}
                      onChange={(e) => setRemoveBrandLogo(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="remove-brand-logo-inline" className="text-xs text-[#4A6A8F]">
                      Remove current logo
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveClinic} className="bg-[#26B170] hover:bg-[#7ED348] text-white">Save Clinic Settings</Button>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 p-3">
                <h4 className="text-sm font-semibold text-[#01377D]">Branding Preview</h4>
                <div className="mt-2 flex items-center gap-3">
                  {brandLogoUrl && !removeBrandLogo ? (
                    <img src={brandLogoUrl} alt="Clinic logo" className="h-12 w-12 rounded-lg border border-cyan-100 object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan-100 bg-white text-[#009DD1]">
                      <SettingsIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-[#01377D]">{brandName}</div>
                    <div className="text-xs text-[#009DD1]">{systemTitle}</div>
                    <div className="text-xs text-[#4A6A8F]">{systemSubtitle}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-[#01377D]">Closures / Exceptions</h4>
                <ul className="mt-2 space-y-2">
                  {closures.map(c => (
                    <li key={c.id} className="flex items-center justify-between bg-[#f8fafc] p-2 rounded">
                      <div>
                        <div className="text-sm text-[#01377D]">{new Date(c.date).toLocaleDateString()}</div>
                        <div className="text-xs text-[#009DD1]">{c.start_time ? c.start_time : 'Full Day'} - {c.end_time ? c.end_time : ''} {c.reason ? `• ${c.reason}` : ''}</div>
                      </div>
                      <Button variant="outline" onClick={() => handleDeleteClosure(c.id)} className="text-[#01377D]">Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {showClosureModal && (
            <ModalPortal>
              <div className={modalBackdropClass}>
                <div className={`${modalPanelClass} max-w-lg`}>
                  <h3 className="text-lg font-semibold mb-2 text-[#01377D]">Add Closure / Exception</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="text-sm">Date</Label>
                    <Input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} />
                    <Label className="text-sm">Start Time (optional)</Label>
                    <Input type="time" value={closureStart} onChange={(e) => setClosureStart(e.target.value)} />
                    <Label className="text-sm">End Time (optional)</Label>
                    <Input type="time" value={closureEnd} onChange={(e) => setClosureEnd(e.target.value)} />
                    <Label className="text-sm">Reason (optional)</Label>
                    <Input placeholder="Reason (optional)" value={closureReason} onChange={(e) => setClosureReason(e.target.value)} />
                  </div>
                  <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => { setShowClosureModal(false); setClosureDate(''); setClosureStart(''); setClosureEnd(''); setClosureReason(''); }}>Cancel</Button>
                    <Button onClick={async () => {
                      try {
                        await handleAddClosure();
                        setShowClosureModal(false);
                      } catch (err) {
                        // handleAddClosure shows toast on error
                      }
                    }} className="bg-[#26B170] hover:bg-[#7ED348] text-white">Add Closure</Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </TabsContent>

          {/* Appointment Types Tab Content */}
          <TabsContent value="appointment-types" className="space-y-4 bg-white">
            <Card className="border-[#97E7F5] shadow-sm">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                    <SettingsIcon className="w-5 h-5 text-[#009DD1]" />
                    Services (Appointment Types)
                  </CardTitle>
                  <CardDescription className="text-[#009DD1]">Control which services are available to patients, how long they take, and whether staff can book them.</CardDescription>
                </div>
                <div className="w-full sm:w-auto">
                  <Button
                    onClick={() => {
                      setEditingType(null);
                      setModalTypeName('');
                      setModalTypeCategory('');
                      setModalTypeDuration(30);
                      setModalTypePrice('');
                      setModalTypeDescription('');
                      setModalTypeActive(true);
                      setModalTypeAvailableFrom('');
                      setModalTypeAvailableUntil('');
                      setModalTypeDays([]);
                      setModalTypeStartTime('');
                      setModalTypeEndTime('');
                      setShowTypeModal(true);
                    }}
                    className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto"
                  >
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentTypes.length === 0 ? (
                  <div className="text-sm text-gray-500">No appointment types configured yet.</div>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                    <div className="mb-2 hidden grid-cols-[minmax(0,1.6fr)_140px_120px_170px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                      <span>Service</span>
                      <span>Category</span>
                      <span className="text-center">Status</span>
                      <span className="text-center">Actions</span>
                    </div>

                    <ul className="space-y-2">
                      {paginatedAppointmentTypes.map((type) => (
                        <li
                          key={type.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.6fr)_140px_120px_170px] md:items-center md:gap-3"
                        >
                          <div>
                            <div className="text-sm font-medium text-[#01377D]">{type.name}</div>
                            <div className="mt-0.5 text-xs text-[#009DD1]">
                              Estimated: {type.estimated_minutes} minutes
                              {type.price !== null && type.price !== undefined && String(type.price) !== ''
                                ? ` • Price: PHP ${Number(type.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : ''}
                              {type.description ? ` • ${type.description}` : ''}
                              {type.available_from || type.available_until
                                ? ` • Date: ${type.available_from || 'Any'} to ${type.available_until || 'Any'}`
                                : ''}
                              {Array.isArray(type.available_days) && type.available_days.length
                                ? ` • Days: ${type.available_days.join(', ').toUpperCase()}`
                                : ''}
                              {type.available_start_time && type.available_end_time
                                ? ` • Time: ${String(type.available_start_time).slice(0, 5)}-${String(type.available_end_time).slice(0, 5)}`
                                : ''}
                            </div>
                          </div>

                          <div className="mt-2 md:mt-0">
                            <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-700">
                              {type.category || 'Uncategorized'}
                            </div>
                          </div>

                          <div className="mt-2 md:mt-0 md:justify-self-center">
                            <Badge className={type.is_active ? 'rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs text-green-700' : 'rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600'}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0 md:justify-self-center md:justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View service details"
                              onClick={() => {
                                setViewingType(type);
                                setShowTypeViewModal(true);
                              }}
                              className="h-8 w-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit service"
                              onClick={() => {
                                setEditingType(type);
                                setModalTypeName(type.name);
                                setModalTypeCategory(type.category || '');
                                setModalTypeDuration(type.estimated_minutes || 30);
                                setModalTypePrice(type.price !== null && type.price !== undefined ? String(type.price) : '');
                                setModalTypeDescription(type.description || '');
                                setModalTypeActive(Boolean(type.is_active));
                                setModalTypeAvailableFrom(type.available_from ? String(type.available_from).slice(0, 10) : '');
                                setModalTypeAvailableUntil(type.available_until ? String(type.available_until).slice(0, 10) : '');
                                setModalTypeDays(Array.isArray(type.available_days) ? type.available_days : []);
                                setModalTypeStartTime(type.available_start_time ? String(type.available_start_time).slice(0, 5) : '');
                                setModalTypeEndTime(type.available_end_time ? String(type.available_end_time).slice(0, 5) : '');
                                setShowTypeModal(true);
                              }}
                              className="h-8 w-8 rounded-lg p-0 text-cyan-700 hover:bg-cyan-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={type.is_active ? 'Deactivate service' : 'Activate service'}
                              onClick={() => handleToggleAppointmentTypeStatus(type)}
                              className={type.is_active ? 'h-8 w-8 rounded-lg p-0 text-amber-700 hover:bg-amber-100' : 'h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100'}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Remove service"
                              onClick={() => handleDeleteAppointmentType(type.id)}
                              className="h-8 w-8 rounded-lg border-rose-200 p-0 text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {appointmentTypes.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          Showing {servicesStartIndex + 1}-{Math.min(servicesStartIndex + servicesPerPage, appointmentTypes.length)} of {appointmentTypes.length} services
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setServicesPage((prev) => Math.max(1, prev - 1))}
                            disabled={servicesPage === 1}
                            className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            Previous
                          </Button>
                          <span className="text-xs text-slate-500">
                            Page {servicesPage} of {totalServicesPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setServicesPage((prev) => Math.min(totalServicesPages, prev + 1))}
                            disabled={servicesPage === totalServicesPages}
                            className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4 bg-white">
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <Clock className="w-5 h-5 text-[#009DD1]" />
                  Booking Interval
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Set the minimum spacing between appointments for all visit types.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interval-input">Interval (minutes)</Label>
                <Input
                  id="interval-input"
                  type="number"
                  min={5}
                  value={appointmentInterval}
                  onChange={(e) => setAppointmentInterval(Number(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-gray-500">This controls how the appointment calendar slots are generated across the clinic.</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveInterval} className="bg-[#009DD1] hover:bg-[#007bb0] text-white">Save Interval</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointment Type Modal */}
        {showTypeModal && (
          <ModalPortal>
            <div className={modalBackdropClass}>
              <div className={modalPanelClass}>
                <h3 className="text-lg font-semibold mb-2 text-[#01377D]">{editingType ? 'Edit Appointment Type' : 'Add Appointment Type'}</h3>
                <div className="space-y-2">
                  <Label className="text-sm">Type name</Label>
                  <Input value={modalTypeName} onChange={(e) => setModalTypeName(e.target.value)} />
                </div>
                <div className="space-y-2 mt-2">
                  <Label className="text-sm">Category (optional)</Label>
                  <Input
                    value={modalTypeCategory}
                    onChange={(e) => setModalTypeCategory(e.target.value)}
                    placeholder="e.g., Laboratory, Imaging, Serology"
                  />
                </div>
                <div className="space-y-2 mt-2">
                  <Label className="text-sm">Description (optional)</Label>
                  <Input value={modalTypeDescription} onChange={(e) => setModalTypeDescription(e.target.value)} />
                </div>
                <div className="space-y-2 mt-2">
                  <Label className="text-sm">Price (PHP)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={modalTypePrice}
                    onChange={(e) => setModalTypePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Available From (optional)</Label>
                    <Input type="date" value={modalTypeAvailableFrom} onChange={(e) => setModalTypeAvailableFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Available Until (optional)</Label>
                    <Input type="date" value={modalTypeAvailableUntil} onChange={(e) => setModalTypeAvailableUntil(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Daily Start Time (optional)</Label>
                    <Input type="time" value={modalTypeStartTime} onChange={(e) => setModalTypeStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Daily End Time (optional)</Label>
                    <Input type="time" value={modalTypeEndTime} onChange={(e) => setModalTypeEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <Label className="text-sm">Available Days (optional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((day) => {
                      const selected = modalTypeDays.includes(day);
                      return (
                        <button
                          key={`service-day-${day}`}
                          type="button"
                          onClick={() =>
                            setModalTypeDays((prev) =>
                              prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                            )
                          }
                          className={`rounded px-2 py-1 text-xs ${
                            selected ? 'bg-[#01377D] text-white' : 'bg-[#EAF5FF] text-[#01377D]'
                          }`}
                        >
                          {day.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min={5}
                    value={modalTypeDuration}
                    onChange={(e) => setModalTypeDuration(Number(e.target.value))}
                    className="w-28"
                  />
                  <span className="text-sm text-[#009DD1]">minutes</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch checked={modalTypeActive} onCheckedChange={setModalTypeActive} id="type-active-switch" />
                  <Label htmlFor="type-active-switch" className="text-sm">Active</Label>
                </div>
                <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTypeModal(false);
                      setEditingType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const payload = {
                          name: modalTypeName,
                          category: modalTypeCategory || null,
                          estimated_minutes: Number(modalTypeDuration),
                          price: modalTypePrice === '' ? null : Number(modalTypePrice),
                          description: modalTypeDescription || null,
                          is_active: modalTypeActive,
                          available_from: modalTypeAvailableFrom || null,
                          available_until: modalTypeAvailableUntil || null,
                          available_days: modalTypeDays.length ? modalTypeDays : null,
                          available_start_time: modalTypeStartTime || null,
                          available_end_time: modalTypeEndTime || null,
                        };
                        if (editingType) {
                          await updateAppointmentType(editingType.id, payload);
                          toast.success('Appointment type updated');
                        } else {
                          await addAppointmentType(payload);
                          toast.success('Appointment type added');
                        }
                        setShowTypeModal(false);
                        setEditingType(null);
                        await loadAppointmentTypesAndReasons();
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to save appointment type');
                      }
                    }}
                    className="bg-[#009DD1] hover:bg-[#007bb0] text-white"
                  >
                    {editingType ? 'Save' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* View Appointment Type Modal */}
        {showTypeViewModal && viewingType && (
          <ModalPortal>
            <div className={modalBackdropClass}>
              <div className={`${modalPanelClass} max-w-2xl`}>
                <h3 className="mb-1 text-lg font-semibold text-[#01377D]">Service Details</h3>
                <p className="mb-4 text-sm text-[#4A6A8F]">
                  Read-only view of the selected appointment type configuration.
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Service name</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{viewingType.name || '-'}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Category</p>
                    <p className="mt-1 text-sm text-slate-800">{viewingType.category || 'Uncategorized'}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Estimated duration</p>
                      <p className="mt-1 text-sm text-slate-800">{viewingType.estimated_minutes || 0} minutes</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Price</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {viewingType.price !== null && viewingType.price !== undefined && String(viewingType.price) !== ''
                          ? `PHP ${Number(viewingType.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                    <div className="mt-1">
                      <Badge className={viewingType.is_active ? 'rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs text-green-700' : 'rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600'}>
                        {viewingType.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                    <p className="mt-1 text-sm text-slate-800">{viewingType.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Date availability</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {(viewingType.available_from || 'Any')} to {(viewingType.available_until || 'Any')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Daily time range</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {viewingType.available_start_time && viewingType.available_end_time
                          ? `${String(viewingType.available_start_time).slice(0, 5)} - ${String(viewingType.available_end_time).slice(0, 5)}`
                          : 'Any time'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Available days</p>
                    <p className="mt-1 text-sm text-slate-800">
                      {Array.isArray(viewingType.available_days) && viewingType.available_days.length
                        ? viewingType.available_days.map((day) => String(day).toUpperCase()).join(', ')
                        : 'All days'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTypeViewModal(false);
                      setViewingType(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* MedCert Reasons Tab Content */}
        <TabsContent value="medcert" className="space-y-4 bg-white">
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <SettingsIcon className="w-5 h-5 text-[#009DD1]" />
                  Medical Certificate Types
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Manage certificate types available for patients to request</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Button onClick={() => { setEditingReason(null); setModalReasonText(''); setShowReasonModal(true); }} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Type</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reasons.length === 0 ? (
                <div className="text-sm text-gray-500">No medical certificate types configured yet.</div>
              ) : (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                  <div className="mb-2 hidden grid-cols-[minmax(0,1.8fr)_120px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                    <span>Type</span>
                    <span className="text-center">Actions</span>
                  </div>

                  <ul className="space-y-2">
                    {reasons.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.8fr)_120px] md:items-center md:gap-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#01377D]">{r.type || r.reason}</div>
                          <div className="mt-0.5 text-xs text-[#009DD1]">
                            Available certificate category for patient requests.
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 md:mt-0 md:justify-self-center md:justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit certificate type"
                            onClick={() => {
                              setEditingReason(r);
                              setModalReasonText(r.type || r.reason);
                              setShowReasonModal(true);
                            }}
                            className="h-8 w-8 rounded-lg p-0 text-cyan-700 hover:bg-cyan-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Remove certificate type"
                            onClick={() => handleDeleteReason(r.id)}
                            className="h-8 w-8 rounded-lg border-rose-200 p-0 text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Type Modal */}
        {showReasonModal && (
          <ModalPortal>
            <div className={modalBackdropClass}>
              <div className={`${modalPanelClass} max-w-lg`}>
                <h3 className="text-lg font-semibold mb-2 text-[#01377D]">{editingReason ? 'Edit Certificate Type' : 'Add Certificate Type'}</h3>
                <div className="space-y-2">
                  <Label className="text-sm">Certificate Type Name</Label>
                  <Input value={modalReasonText} onChange={(e) => setModalReasonText(e.target.value)} placeholder="e.g., Sick Leave Certificate" />
                </div>
                <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setShowReasonModal(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      if (editingReason) {
                        await updateMedcertReason(editingReason.id, { type: modalReasonText });
                        toast.success('Certificate type updated');
                      } else {
                        await addMedcertReason({ type: modalReasonText });
                        toast.success('Certificate type added');
                      }
                      setShowReasonModal(false);
                      await loadAppointmentTypesAndReasons();
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to save certificate type');
                    }
                  }} className="bg-[#009DD1] hover:bg-[#007bb0] text-white">{editingReason ? 'Save' : 'Add'}</Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Document Types Tab Content */}
        <TabsContent value="document-types" className="space-y-4 bg-white">
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <FileText className="w-5 h-5 text-[#009DD1]" />
                  Document Types
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Manage document types available for patients to upload</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Button onClick={() => { setEditingDocType(null); setModalDocTypeName(''); setModalDocTypeActive(true); setShowDocTypeModal(true); }} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Type</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentTypes.length === 0 ? (
                <div className="text-sm text-gray-500">No document types configured yet.</div>
              ) : (
                <ul className="mt-2 space-y-2">
                  {documentTypes.map((docType) => (
                    <li key={docType.id} className="flex items-center justify-between bg-[#f8fafc] p-3 rounded">
                      <div>
                        <div className="text-sm text-[#01377D] font-medium">{docType.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={docType.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}>
                          {docType.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingDocType(docType);
                            setModalDocTypeName(docType.name);
                            setModalDocTypeActive(Boolean(docType.is_active));
                            setShowDocTypeModal(true);
                          }}
                          className="text-[#009DD1]"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleToggleDocTypeStatus(docType)}
                          className="text-[#01377D]"
                        >
                          {docType.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="outline" onClick={() => handleDeleteDocType(docType.id)} className="text-[#01377D]">
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Type Modal */}
        {showDocTypeModal && (
          <ModalPortal>
            <div className={modalBackdropClass}>
              <div className={`${modalPanelClass} max-w-lg`}>
                <h3 className="text-lg font-semibold mb-2 text-[#01377D]">{editingDocType ? 'Edit Document Type' : 'Add Document Type'}</h3>
                <div className="space-y-2">
                  <Label className="text-sm">Document Type Name</Label>
                  <Input value={modalDocTypeName} onChange={(e) => setModalDocTypeName(e.target.value)} placeholder="e.g., Lab Results, Prescription, Insurance Card" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch checked={modalDocTypeActive} onCheckedChange={setModalDocTypeActive} id="doctype-active-switch" />
                  <Label htmlFor="doctype-active-switch" className="text-sm">Active</Label>
                </div>
                <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setShowDocTypeModal(false)}>Cancel</Button>
                  <Button onClick={async () => {
                    try {
                      if (!modalDocTypeName) {
                        toast.error('Document type name is required');
                        return;
                      }
                      const payload = {
                        name: modalDocTypeName,
                        is_active: modalDocTypeActive,
                      };
                      if (editingDocType) {
                        await updateDocumentType(editingDocType.id, payload);
                        toast.success('Document type updated');
                      } else {
                        await addDocumentType(payload);
                        toast.success('Document type added');
                      }
                      setShowDocTypeModal(false);
                      setEditingDocType(null);
                      await loadAppointmentTypesAndReasons();
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to save document type');
                    }
                  }} className="bg-[#009DD1] hover:bg-[#007bb0] text-white">{editingDocType ? 'Save' : 'Add'}</Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;