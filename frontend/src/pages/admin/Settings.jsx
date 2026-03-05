// Settings.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button as UIButton } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Settings as SettingsIcon, Bell, Shield, Database, Mail, Eye, EyeOff, Clock, FileText, Sparkles, Pencil, Power, Trash2, Info, Loader2, Search, X, ChevronDown, Check, CalendarDays } from 'lucide-react';
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

const Button = ({ type = 'button', ...props }) => <UIButton type={type} {...props} />;

export const Settings = () => {
  const { reloadBranding, applyBrandingFromSettings } = useBranding();
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('email');
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
  const [smtpModalPhase, setSmtpModalPhase] = useState('closed');
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpEncryptionPhase, setSmtpEncryptionPhase] = useState('closed');
  const smtpModalTimerRef = useRef(null);
  const smtpDropdownTimerRef = useRef(null);
  const smtpEncryptionMenuRef = useRef(null);
  const SMTP_ENCRYPTION_OPTIONS = [
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' },
    { value: 'none', label: 'None' },
  ];

  const handleOpenEmailModal = () => {
    if (smtpModalTimerRef.current) {
      clearTimeout(smtpModalTimerRef.current);
      smtpModalTimerRef.current = null;
    }
    setShowEmailModal(true);
    setSmtpModalPhase('opening');
    requestAnimationFrame(() => setSmtpModalPhase('open'));
    setSmtpEncryptionPhase('closed');
  };

  const closeSmtpEncryptionDropdown = () => {
    if (smtpDropdownTimerRef.current) {
      clearTimeout(smtpDropdownTimerRef.current);
    }
    setSmtpEncryptionPhase('closing');
    smtpDropdownTimerRef.current = setTimeout(() => {
      setSmtpEncryptionPhase('closed');
      smtpDropdownTimerRef.current = null;
    }, 240);
  };

  const openSmtpEncryptionDropdown = () => {
    if (smtpDropdownTimerRef.current) {
      clearTimeout(smtpDropdownTimerRef.current);
      smtpDropdownTimerRef.current = null;
    }
    setSmtpEncryptionPhase('opening');
    requestAnimationFrame(() => setSmtpEncryptionPhase('open'));
  };

  const toggleSmtpEncryptionDropdown = () => {
    if (smtpEncryptionPhase === 'open' || smtpEncryptionPhase === 'opening') {
      closeSmtpEncryptionDropdown();
      return;
    }
    openSmtpEncryptionDropdown();
  };

  const handleCloseEmailModal = () => {
    if (isSavingSmtp) return;
    closeSmtpEncryptionDropdown();
    setSmtpModalPhase('closing');
    if (smtpModalTimerRef.current) {
      clearTimeout(smtpModalTimerRef.current);
    }
    smtpModalTimerRef.current = setTimeout(() => {
      setShowEmailModal(false);
      setSmtpModalPhase('closed');
      smtpModalTimerRef.current = null;
    }, 300);
  };

  const handleSaveSmtp = async () => {
    if (isSavingSmtp) return;

    const trimmedEmail = smtpEmail?.trim();
    if (!trimmedEmail) {
      toast.error('Email is required for SMTP configuration');
      return;
    }

    const normalizedPort = Number(smtpPort);
    if (!Number.isFinite(normalizedPort) || normalizedPort < 1) {
      toast.error('SMTP port must be a valid number');
      return;
    }

    setIsSavingSmtp(true);
    try {
      const res = await saveMailSettings({
        email: trimmedEmail,
        password: smtpPassword,
        host: smtpHost,
        port: Math.round(normalizedPort),
        encryption: smtpEncryption,
      });

      if (res?.data?.success) {
        toast.success(res.data.message || 'Mail settings saved');
        setSmtpPassword('');
        handleCloseEmailModal();
        return;
      }

      const msg = res?.data?.error || res?.data?.message || 'Failed to save mail settings';
      toast.error(msg);
    } catch (err) {
      console.error(err);
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      toast.error(serverMsg || 'Failed to save mail settings');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSmtpPortChange = (value) => {
    if (value === '') {
      setSmtpPort('');
      return;
    }
    const numericPort = Number(value);
    if (Number.isFinite(numericPort)) {
      setSmtpPort(numericPort);
    }
  };

  useEffect(() => {
    return () => {
      if (smtpModalTimerRef.current) {
        clearTimeout(smtpModalTimerRef.current);
      }
      if (smtpDropdownTimerRef.current) {
        clearTimeout(smtpDropdownTimerRef.current);
      }
      if (closureModalTimerRef.current) {
        clearTimeout(closureModalTimerRef.current);
      }
      if (typeModalTimerRef.current) {
        clearTimeout(typeModalTimerRef.current);
      }
      if (reasonModalTimerRef.current) {
        clearTimeout(reasonModalTimerRef.current);
      }
      if (docTypeModalTimerRef.current) {
        clearTimeout(docTypeModalTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showEmailModal) return undefined;

    const handleOutsideClick = (event) => {
      if (smtpEncryptionMenuRef.current && !smtpEncryptionMenuRef.current.contains(event.target)) {
        closeSmtpEncryptionDropdown();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeSmtpEncryptionDropdown();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEmailModal]);

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
  const [isSavingClinic, setIsSavingClinic] = useState(false);
  const [isSavingInterval, setIsSavingInterval] = useState(false);

  // Closures state
  const [closureDate, setClosureDate] = useState('');
  const [closureStart, setClosureStart] = useState('');
  const [closureEnd, setClosureEnd] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [closures, setClosures] = useState([]);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureModalPhase, setClosureModalPhase] = useState('closed');
  const [isAddingClosure, setIsAddingClosure] = useState(false);
  const closureModalTimerRef = useRef(null);

  const resetClosureForm = () => {
    setClosureDate('');
    setClosureStart('');
    setClosureEnd('');
    setClosureReason('');
  };

  const handleOpenClosureModal = () => {
    if (closureModalTimerRef.current) {
      clearTimeout(closureModalTimerRef.current);
      closureModalTimerRef.current = null;
    }
    setShowClosureModal(true);
    setClosureModalPhase('opening');
    requestAnimationFrame(() => setClosureModalPhase('open'));
  };

  const handleCloseClosureModal = ({ reset = false } = {}) => {
    if (isAddingClosure) return;
    setClosureModalPhase('closing');
    if (closureModalTimerRef.current) {
      clearTimeout(closureModalTimerRef.current);
    }
    closureModalTimerRef.current = setTimeout(() => {
      setShowClosureModal(false);
      setClosureModalPhase('closed');
      if (reset) resetClosureForm();
      closureModalTimerRef.current = null;
    }, 260);
  };

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

  const handleAppointmentIntervalInputChange = (value) => {
    if (value === '') {
      setAppointmentInterval('');
      return;
    }

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setAppointmentInterval(parsed);
    }
  };

  const handleSaveClinic = async () => {
    if (isSavingClinic) return;

    const normalizedInterval = Number(appointmentInterval);
    if (!Number.isFinite(normalizedInterval) || normalizedInterval < 1) {
      toast.error('Appointment interval must be at least 1 minute');
      return;
    }

    setIsSavingClinic(true);
    try {
      const payload = new FormData();
      payload.append('open_time', openTime);
      payload.append('close_time', closeTime);
      payload.append('appointment_interval', String(Math.round(normalizedInterval)));
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
    } finally {
      setIsSavingClinic(false);
    }
  };

  const handleAddClosure = async () => {
    if (isAddingClosure) return false;
    if (!closureDate) {
      toast.error('Please choose a date for closure');
      return false;
    }
    setIsAddingClosure(true);
    try {
      const payload = {
        date: closureDate,
        start_time: closureStart || null,
        end_time: closureEnd || null,
        reason: closureReason || null,
      };
      await addClinicClosure(payload);
      toast.success('Closure added');
      await loadClosuresOnly();
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to add closure');
      return false;
    } finally {
      setIsAddingClosure(false);
    }
  };

  const handleDeleteClosure = async (id) => {
    try {
      await deleteClinicClosure(id);
      toast.success('Closure removed');
      await loadClosuresOnly();
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
    if (isSavingInterval) return;

    const normalizedInterval = Number(appointmentInterval);
    if (!Number.isFinite(normalizedInterval) || normalizedInterval < 1) {
      toast.error('Booking interval must be at least 1 minute');
      return;
    }

    setIsSavingInterval(true);
    try {
      const res = await saveClinicSettings({ appointment_interval: Math.round(normalizedInterval) });
      const refreshed = res?.data?.data?.settings || res?.data?.settings || null;
      if (refreshed?.appointment_interval !== undefined) {
        setAppointmentInterval(Number(refreshed.appointment_interval));
      }
      toast.success('Booking interval saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save interval');
    } finally {
      setIsSavingInterval(false);
    }
  };

  const bookingIntervalPreview = useMemo(() => {
    const interval = Math.max(1, Math.round(Number(appointmentInterval) || 1));
    const toMinutes = (timeString) => {
      if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return null;
      const [h, m] = timeString.split(':').map((part) => Number(part));
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      return h * 60 + m;
    };
    const toTimeLabel = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const hour12 = ((hours + 11) % 12) + 1;
      return `${hour12}:${String(mins).padStart(2, '0')} ${suffix}`;
    };

    const startMinutes = toMinutes(openTime || '08:00');
    const endMinutes = toMinutes(closeTime || '17:00');
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return {
        slotsPerDay: null,
        sample: [],
      };
    }

    const slotsPerDay = Math.floor((endMinutes - startMinutes) / interval);
    const sample = Array.from({ length: 4 })
      .map((_, index) => startMinutes + index * interval)
      .filter((value) => value < endMinutes)
      .map((value) => toTimeLabel(value));

    return {
      slotsPerDay,
      sample,
    };
  }, [appointmentInterval, openTime, closeTime]);

  // Appointment types state
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeModalPhase, setTypeModalPhase] = useState('closed');
  const [isSavingTypeModal, setIsSavingTypeModal] = useState(false);
  const [serviceStatusLoadingId, setServiceStatusLoadingId] = useState(null);
  const [serviceDeleteConfirmId, setServiceDeleteConfirmId] = useState(null);
  const [serviceDeleteLoadingId, setServiceDeleteLoadingId] = useState(null);
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
  const modalTypeFromRef = useRef(null);
  const modalTypeUntilRef = useRef(null);
  const modalTypeStartRef = useRef(null);
  const modalTypeEndRef = useRef(null);
  const [showTypeViewModal, setShowTypeViewModal] = useState(false);
  const [viewingType, setViewingType] = useState(null);
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 10;
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const typeModalTimerRef = useRef(null);

  const weekdayOptions = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const modalBackdropClass =
    'fixed inset-0 z-[9999] grid place-items-center bg-slate-900/55 p-4';
  const modalPanelClass =
    'w-full max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl border border-[#CFE5F7] bg-white p-6 sm:p-7 shadow-[0_24px_65px_rgba(2,32,71,0.34)]';
  const smtpModalBackdropClass =
    'fixed inset-0 z-[9999] grid place-items-center bg-slate-900/60 p-3 backdrop-blur-[1px] transition-opacity duration-300 ease-out';
  const smtpModalPanelClass =
    'w-full max-h-[94vh] max-w-[760px] overflow-y-auto rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_30px_75px_rgba(2,32,71,0.35)] transition-all duration-300 ease-out sm:max-h-[92vh] sm:rounded-3xl sm:p-7';
  const closureModalBackdropClass =
    'fixed inset-0 z-[9999] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-[1px] transition-opacity duration-300 ease-out';
  const closureModalPanelClass =
    'w-full max-h-[92vh] max-w-lg overflow-y-auto rounded-2xl border border-cyan-100 bg-white p-5 shadow-[0_24px_65px_rgba(2,32,71,0.34)] transition-all duration-300 ease-out sm:p-7';
  const typeModalBackdropClass =
    'fixed inset-0 z-[9999] grid place-items-center bg-slate-900/55 p-4 backdrop-blur-[1px] transition-opacity duration-300 ease-out';
  const typeModalPanelClass =
    'w-full max-h-[90vh] max-w-[840px] overflow-y-auto rounded-2xl border border-cyan-100 bg-white p-4 shadow-[0_24px_65px_rgba(2,32,71,0.34)] transition-all duration-300 ease-out sm:p-5';
  const formInputClass =
    'h-10 rounded-lg border border-slate-200 bg-white text-slate-700 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200';
  const formLabelClass = 'text-xs font-semibold uppercase tracking-[0.08em] text-slate-500';
  const tabTriggerClass =
    'min-h-10 px-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-50 data-[state=active]:bg-cyan-600 data-[state=active]:text-white sm:px-3';
  const tabContentClass =
    'space-y-4 bg-white data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 data-[state=active]:duration-300';

  const ModalPortal = ({ children }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
  };

  // MedCert reasons state
  const [reasons, setReasons] = useState([]);
  const [newReason, setNewReason] = useState('');
  // Reason modal / edit
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonModalPhase, setReasonModalPhase] = useState('closed');
  const [isSavingReasonModal, setIsSavingReasonModal] = useState(false);
  const [editingReason, setEditingReason] = useState(null);
  const [modalReasonText, setModalReasonText] = useState('');
  const [reasonsPage, setReasonsPage] = useState(1);
  const reasonsPerPage = 10;
  const [reasonsSearchQuery, setReasonsSearchQuery] = useState('');
  const reasonModalTimerRef = useRef(null);

  // Document types state
  const [documentTypes, setDocumentTypes] = useState([]);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [docTypeModalPhase, setDocTypeModalPhase] = useState('closed');
  const [isSavingDocTypeModal, setIsSavingDocTypeModal] = useState(false);
  const [editingDocType, setEditingDocType] = useState(null);
  const [modalDocTypeName, setModalDocTypeName] = useState('');
  const [modalDocTypeActive, setModalDocTypeActive] = useState(true);
  const [docStatusLoadingId, setDocStatusLoadingId] = useState(null);
  const [docDeleteConfirmId, setDocDeleteConfirmId] = useState(null);
  const [docDeleteLoadingId, setDocDeleteLoadingId] = useState(null);
  const docTypeModalTimerRef = useRef(null);

  const loadAppointmentTypes = async () => {
    try {
      const s = await listAppointmentTypes();
      const list = s.data?.data?.appointment_types || s.data?.data || s.data?.appointment_types || [];
      setAppointmentTypes(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReasons = async () => {
    try {
      const r = await listMedcertReasons();
      const rr = r.data?.data?.reasons || r.data?.data?.types || r.data?.data || r.data?.reasons || [];
      setReasons(Array.isArray(rr) ? rr : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDocumentTypesOnly = async () => {
    try {
      const d = await listDocumentTypes();
      const dd = d.data?.data?.document_types || d.data?.data || d.data?.document_types || [];
      setDocumentTypes(Array.isArray(dd) ? dd : []);
    } catch (err) {
      console.error('Failed to load document types:', err);
    }
  };

  const loadClosuresOnly = async () => {
    try {
      const c = await listClinicClosures();
      const list = c.data?.data?.closures || c.data?.data || c.data?.closures || [];
      setClosures(list || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load closures');
    }
  };

  const loadAppointmentTypesAndReasons = async () => {
    await Promise.all([loadAppointmentTypes(), loadReasons(), loadDocumentTypesOnly()]);
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
    if (serviceDeleteLoadingId === id) return;
    setServiceDeleteLoadingId(id);
    setServiceDeleteConfirmId(null);

    try {
      await deleteAppointmentType(id);
      toast.success('Appointment type removed');
      await loadAppointmentTypes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove appointment type');
    } finally {
      setServiceDeleteLoadingId(null);
    }
  };

  const handleToggleAppointmentTypeStatus = async (type) => {
    if (serviceStatusLoadingId === type.id || serviceDeleteLoadingId === type.id) return;
    setServiceStatusLoadingId(type.id);
    setServiceDeleteConfirmId((prev) => (prev === type.id ? null : prev));

    const nextIsActive = !type.is_active;

    try {
      await updateAppointmentType(type.id, { is_active: nextIsActive });
      toast.success(
        nextIsActive
          ? 'Appointment type activated'
          : 'Appointment type deactivated (not available for booking)'
      );
      await loadAppointmentTypes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setServiceStatusLoadingId(null);
    }
  };

  const filteredAppointmentTypes = useMemo(() => {
    const query = servicesSearchQuery.trim().toLowerCase();
    if (!query) return appointmentTypes;
    return appointmentTypes.filter((type) => {
      const name = String(type?.name || '').toLowerCase();
      const category = String(type?.category || '').toLowerCase();
      const description = String(type?.description || '').toLowerCase();
      return name.includes(query) || category.includes(query) || description.includes(query);
    });
  }, [appointmentTypes, servicesSearchQuery]);

  const totalServicesPages = Math.max(1, Math.ceil(filteredAppointmentTypes.length / servicesPerPage));
  const servicesStartIndex = (servicesPage - 1) * servicesPerPage;
  const paginatedAppointmentTypes = filteredAppointmentTypes.slice(
    servicesStartIndex,
    servicesStartIndex + servicesPerPage
  );

  useEffect(() => {
    setServicesPage(1);
  }, [appointmentTypes.length, servicesSearchQuery]);

  useEffect(() => {
    if (
      serviceDeleteConfirmId !== null &&
      !appointmentTypes.some((type) => type.id === serviceDeleteConfirmId)
    ) {
      setServiceDeleteConfirmId(null);
    }
  }, [appointmentTypes, serviceDeleteConfirmId]);

  useEffect(() => {
    if (servicesPage > totalServicesPages) {
      setServicesPage(totalServicesPages);
    }
  }, [servicesPage, totalServicesPages]);

  const handleOpenTypeModal = () => {
    if (typeModalTimerRef.current) {
      clearTimeout(typeModalTimerRef.current);
      typeModalTimerRef.current = null;
    }
    setShowTypeModal(true);
    setTypeModalPhase('opening');
    setIsSavingTypeModal(false);
    requestAnimationFrame(() => setTypeModalPhase('open'));
  };

  const handleCloseTypeModal = ({ resetEdit = true } = {}) => {
    if (isSavingTypeModal) return;
    setTypeModalPhase('closing');
    if (typeModalTimerRef.current) {
      clearTimeout(typeModalTimerRef.current);
    }
    typeModalTimerRef.current = setTimeout(() => {
      setShowTypeModal(false);
      setTypeModalPhase('closed');
      if (resetEdit) setEditingType(null);
      typeModalTimerRef.current = null;
    }, 260);
  };

  const handleSaveTypeModal = async () => {
    if (isSavingTypeModal) return;
    if (!modalTypeName?.trim()) {
      toast.error('Type name is required');
      return;
    }

    setIsSavingTypeModal(true);
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

      handleCloseTypeModal({ resetEdit: true });
      await loadAppointmentTypes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save appointment type');
    } finally {
      setIsSavingTypeModal(false);
    }
  };

  const openNativePicker = (inputRef) => {
    const element = inputRef?.current;
    if (!element) return;
    if (typeof element.showPicker === 'function') {
      try {
        element.showPicker();
        return;
      } catch (err) {
        // Ignore and fallback to focus/click for restricted browsers.
      }
    }
    element.focus();
    element.click();
  };

  const filteredReasons = useMemo(() => {
    const query = reasonsSearchQuery.trim().toLowerCase();
    if (!query) return reasons;
    return reasons.filter((reason) => {
      const label = String(reason?.type || reason?.reason || '').toLowerCase();
      return label.includes(query);
    });
  }, [reasons, reasonsSearchQuery]);

  const totalReasonsPages = Math.max(1, Math.ceil(filteredReasons.length / reasonsPerPage));
  const reasonsStartIndex = (reasonsPage - 1) * reasonsPerPage;
  const paginatedReasons = filteredReasons.slice(reasonsStartIndex, reasonsStartIndex + reasonsPerPage);

  useEffect(() => {
    setReasonsPage(1);
  }, [reasons.length, reasonsSearchQuery]);

  useEffect(() => {
    if (reasonsPage > totalReasonsPages) {
      setReasonsPage(totalReasonsPages);
    }
  }, [reasonsPage, totalReasonsPages]);

  useEffect(() => {
    if (docDeleteConfirmId !== null && !documentTypes.some((doc) => doc.id === docDeleteConfirmId)) {
      setDocDeleteConfirmId(null);
    }
  }, [documentTypes, docDeleteConfirmId]);

  const handleOpenReasonModal = (reason = null) => {
    if (reasonModalTimerRef.current) {
      clearTimeout(reasonModalTimerRef.current);
      reasonModalTimerRef.current = null;
    }
    setEditingReason(reason);
    setModalReasonText(reason ? reason.type || reason.reason || '' : '');
    setShowReasonModal(true);
    setReasonModalPhase('opening');
    setIsSavingReasonModal(false);
    requestAnimationFrame(() => setReasonModalPhase('open'));
  };

  const handleCloseReasonModal = ({ resetEdit = true } = {}) => {
    if (isSavingReasonModal) return;
    setReasonModalPhase('closing');
    if (reasonModalTimerRef.current) {
      clearTimeout(reasonModalTimerRef.current);
    }
    reasonModalTimerRef.current = setTimeout(() => {
      setShowReasonModal(false);
      setReasonModalPhase('closed');
      if (resetEdit) {
        setEditingReason(null);
        setModalReasonText('');
      }
      reasonModalTimerRef.current = null;
    }, 260);
  };

  const handleSaveReasonModal = async () => {
    if (isSavingReasonModal) return;
    const trimmedReason = modalReasonText?.trim();
    if (!trimmedReason) {
      toast.error('Certificate type name is required');
      return;
    }

    setIsSavingReasonModal(true);
    try {
      if (editingReason) {
        await updateMedcertReason(editingReason.id, { type: trimmedReason });
        toast.success('Certificate type updated');
      } else {
        await addMedcertReason({ type: trimmedReason });
        toast.success('Certificate type added');
      }
      handleCloseReasonModal({ resetEdit: true });
      await loadReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save certificate type');
    } finally {
      setIsSavingReasonModal(false);
    }
  };

  const handleOpenDocTypeModal = (docType = null) => {
    if (docTypeModalTimerRef.current) {
      clearTimeout(docTypeModalTimerRef.current);
      docTypeModalTimerRef.current = null;
    }
    setEditingDocType(docType);
    setModalDocTypeName(docType?.name || '');
    setModalDocTypeActive(docType ? Boolean(docType.is_active) : true);
    setShowDocTypeModal(true);
    setDocTypeModalPhase('opening');
    setIsSavingDocTypeModal(false);
    requestAnimationFrame(() => setDocTypeModalPhase('open'));
  };

  const handleCloseDocTypeModal = ({ resetEdit = true } = {}) => {
    if (isSavingDocTypeModal) return;
    setDocTypeModalPhase('closing');
    if (docTypeModalTimerRef.current) {
      clearTimeout(docTypeModalTimerRef.current);
    }
    docTypeModalTimerRef.current = setTimeout(() => {
      setShowDocTypeModal(false);
      setDocTypeModalPhase('closed');
      if (resetEdit) {
        setEditingDocType(null);
        setModalDocTypeName('');
        setModalDocTypeActive(true);
      }
      docTypeModalTimerRef.current = null;
    }, 260);
  };

  const handleSaveDocTypeModal = async () => {
    if (isSavingDocTypeModal) return;
    const trimmedDocTypeName = modalDocTypeName?.trim();
    if (!trimmedDocTypeName) {
      toast.error('Document type name is required');
      return;
    }

    setIsSavingDocTypeModal(true);
    try {
      const payload = {
        name: trimmedDocTypeName,
        is_active: modalDocTypeActive,
      };
      if (editingDocType) {
        await updateDocumentType(editingDocType.id, payload);
        toast.success('Document type updated');
      } else {
        await addDocumentType(payload);
        toast.success('Document type added');
      }
      handleCloseDocTypeModal({ resetEdit: true });
      await loadDocumentTypesOnly();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save document type');
    } finally {
      setIsSavingDocTypeModal(false);
    }
  };

  const handleAddReason = async () => {
    if (!newReason) return toast.error('Reason required');
    try {
      await addMedcertReason({ reason: newReason });
      toast.success('Reason added');
      setNewReason('');
      await loadReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to add reason');
    }
  };

  const handleDeleteReason = async (id) => {
    try {
      await deleteMedcertReason(id);
      toast.success('Reason removed');
      await loadReasons();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove reason');
    }
  };

  const handleDeleteDocType = async (id) => {
    if (docDeleteLoadingId === id) return;
    setDocDeleteLoadingId(id);
    setDocDeleteConfirmId(null);

    try {
      await deleteDocumentType(id);
      toast.success('Document type removed');
      await loadDocumentTypesOnly();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove document type');
    } finally {
      setDocDeleteLoadingId(null);
    }
  };

  const handleToggleDocTypeStatus = async (docType) => {
    if (docStatusLoadingId === docType.id || docDeleteLoadingId === docType.id) return;
    setDocStatusLoadingId(docType.id);
    setDocDeleteConfirmId((prev) => (prev === docType.id ? null : prev));

    const nextIsActive = !docType.is_active;

    try {
      await toggleDocumentTypeStatus(docType.id, nextIsActive);
      toast.success(nextIsActive ? 'Document type activated' : 'Document type deactivated');
      await loadDocumentTypesOnly();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    } finally {
      setDocStatusLoadingId(null);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-1">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:flex sm:flex-wrap sm:justify-start">
          <TabsTrigger
            value="email"
            aria-label="Email"
            className={tabTriggerClass}
          >
            <Mail className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger
            value="clinic"
            aria-label="Clinic Hours"
            className={tabTriggerClass}
          >
            <SettingsIcon className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Clinic Hours</span>
          </TabsTrigger>
          <TabsTrigger
            value="appointment-types"
            aria-label="Services"
            className={tabTriggerClass}
          >
            <Database className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger
            value="scheduling"
            aria-label="Booking Interval"
            className={tabTriggerClass}
          >
            <Clock className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Booking Interval</span>
          </TabsTrigger>
          <TabsTrigger
            value="medcert"
            aria-label="MedCert Types"
            className={tabTriggerClass}
          >
            <Shield className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">MedCert Types</span>
          </TabsTrigger>
          <TabsTrigger
            value="document-types"
            aria-label="Document Types"
            className={tabTriggerClass}
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Document Types</span>
          </TabsTrigger>
        </TabsList>
        {/* Email (SMTP) Settings (header button + modal) */}
        <TabsContent value="email" className={tabContentClass}>
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
                <Button onClick={handleOpenEmailModal} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">{smtpEmail ? 'Edit' : 'Add'}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {smtpEmail ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Configured Account</div>
                  <div className="mt-1 text-sm font-medium text-[#01377D]">{smtpEmail}</div>
                  <div className="mt-1 text-xs text-[#01377D]">{smtpHost}:{smtpPort} • {smtpEncryption?.toUpperCase()}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
                    <div className="text-sm text-[#01377D]">No SMTP account configured. Click Add to configure.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {(showEmailModal || smtpModalPhase === 'closing') && (
            <ModalPortal>
              {(() => {
                const smtpModalVisible = smtpModalPhase === 'open';
                return (
              <div
                className={`${smtpModalBackdropClass} ${smtpModalVisible ? 'opacity-100' : 'opacity-0'}`}
                onMouseDown={handleCloseEmailModal}
              >
                <div
                  className={`${smtpModalPanelClass} ${smtpModalVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-[#01377D] sm:text-xl">{smtpEmail ? 'Edit SMTP Account' : 'Add SMTP Account'}</h3>
                  <p className="mb-4 text-sm text-[#4A6A8F] sm:mb-5">Configure mail sender credentials used for system notifications.</p>
                  <div className="space-y-2">
                    <Label className={formLabelClass}>Email (Gmail account)</Label>
                    <Input value={smtpEmail} onChange={(e) => setSmtpEmail(e.target.value)} className={formInputClass} />
                  </div>
                  <div className="space-y-2 mt-2">
                    <Label className={formLabelClass}>App Password</Label>
                    <div className="relative">
                      <Input type={showSmtpPassword ? 'text' : 'password'} value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className={`${formInputClass} pr-10`} />
                      <button type="button" onClick={() => setShowSmtpPassword((v) => !v)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#009DD1] p-1">
                        {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use a Gmail App Password (recommended) if your account has 2FA.</p>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className={formLabelClass}>SMTP Host</Label>
                      <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className={formInputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={formLabelClass}>SMTP Port</Label>
                      <Input type="number" min={1} value={smtpPort} onChange={(e) => handleSmtpPortChange(e.target.value)} className={formInputClass} />
                    </div>
                    <div className="space-y-2">
                      <Label className={formLabelClass}>Encryption</Label>
                      <div className="relative" ref={smtpEncryptionMenuRef}>
                        <button
                          type="button"
                          onClick={toggleSmtpEncryptionDropdown}
                          className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-slate-700 transition-all duration-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200"
                        >
                          <span className="text-sm">{SMTP_ENCRYPTION_OPTIONS.find((option) => option.value === smtpEncryption)?.label || 'TLS'}</span>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                            smtpEncryptionPhase === 'open' ? 'rotate-180' : ''
                          }`} />
                        </button>
                        {(smtpEncryptionPhase === 'open' || smtpEncryptionPhase === 'opening' || smtpEncryptionPhase === 'closing') && (
                          <div
                            className={`absolute bottom-full left-0 right-0 z-[10050] mb-2 origin-bottom rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg transition-all duration-300 ease-out ${
                              smtpEncryptionPhase === 'open'
                                ? 'translate-y-0 scale-100 opacity-100'
                                : 'pointer-events-none translate-y-1 scale-95 opacity-0'
                            }`}
                          >
                          {SMTP_ENCRYPTION_OPTIONS.map((option) => {
                            const selected = smtpEncryption === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  setSmtpEncryption(option.value);
                                  closeSmtpEncryptionDropdown();
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                                  selected
                                    ? 'bg-cyan-50 text-cyan-800'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{option.label}</span>
                                {selected ? <Check className="h-4 w-4 text-cyan-700" /> : null}
                              </button>
                            );
                          })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSavingSmtp && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving SMTP settings...
                    </div>
                  )}
                  <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:border-t-0 sm:pt-0">
                    <Button
                      variant="outline"
                      disabled={isSavingSmtp}
                      onClick={handleCloseEmailModal}
                      className="h-10 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isSavingSmtp}
                      onClick={handleSaveSmtp}
                      className="h-10 w-full bg-gradient-to-r from-[#009DD1] to-[#0277b8] text-white shadow-sm hover:from-[#028fc0] hover:to-[#016da9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {isSavingSmtp ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
                );
              })()}
            </ModalPortal>
          )}
        </TabsContent>

        {/* Additional tabs defined below */}

        {/* Clinic Closures (show only closures, add via modal) */}
        <TabsContent value="clinic" className={tabContentClass}>
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
                <Button onClick={handleOpenClosureModal} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Closure</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-sm font-semibold text-[#01377D]">Clinic Hours & Branding</h4>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className={formLabelClass}>Opening Time</Label>
                    <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>Closing Time</Label>
                    <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>Appointment Interval (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={appointmentInterval}
                      onChange={(e) => handleAppointmentIntervalInputChange(e.target.value)}
                      className={formInputClass}
                    />
                  </div>
                </div>

                <div>
                  <Label className={formLabelClass}>Regular Working Days</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                          workingDays.includes(d)
                            ? 'border-[#01377D] bg-[#01377D] text-white shadow-sm'
                            : 'border-[#BFE8F5] bg-[#F2FCFF] text-[#01377D] hover:border-[#009DD1] hover:text-[#009DD1]'
                        }`}
                      >
                        {d.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className={formLabelClass}>Header Name</Label>
                    <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>Short Name</Label>
                    <Input value={brandShortName} onChange={(e) => setBrandShortName(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>System Title</Label>
                    <Input value={systemTitle} onChange={(e) => setSystemTitle(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>System Subtitle</Label>
                    <Input value={systemSubtitle} onChange={(e) => setSystemSubtitle(e.target.value)} className={formInputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className={formLabelClass}>Footer Description</Label>
                    <Input value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>Contact Email</Label>
                    <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={formInputClass} />
                  </div>
                  <div>
                    <Label className={formLabelClass}>Contact Phone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={formInputClass} />
                  </div>
                </div>

                <div>
                  <Label className={formLabelClass}>Logo (optional)</Label>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setBrandLogoFile(e.target.files?.[0] || null)}
                    className={`${formInputClass} file:mr-3 file:rounded-md file:border-0 file:bg-cyan-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-cyan-700 hover:file:bg-cyan-100`}
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

                <div className="flex flex-col items-end gap-2">
                  {isSavingClinic && (
                    <span className="text-xs font-medium text-[#009DD1]">Saving changes...</span>
                  )}
                  <Button
                    onClick={handleSaveClinic}
                    disabled={isSavingClinic}
                    className="w-full bg-[#26B170] text-white hover:bg-[#7ED348] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingClinic ? 'Saving...' : 'Save Clinic Settings'}
                  </Button>
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

          {(showClosureModal || closureModalPhase === 'closing') && (
            <ModalPortal>
              <div
                className={`${closureModalBackdropClass} ${closureModalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`}
                onMouseDown={() => handleCloseClosureModal({ reset: false })}
              >
                <div
                  className={`${closureModalPanelClass} ${closureModalPhase === 'open' ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 text-lg font-semibold text-[#01377D] sm:text-xl">Add Closure / Exception</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <Label className={formLabelClass}>Date</Label>
                    <Input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} className={formInputClass} />
                    <Label className={formLabelClass}>Start Time (optional)</Label>
                    <Input type="time" value={closureStart} onChange={(e) => setClosureStart(e.target.value)} className={formInputClass} />
                    <Label className={formLabelClass}>End Time (optional)</Label>
                    <Input type="time" value={closureEnd} onChange={(e) => setClosureEnd(e.target.value)} className={formInputClass} />
                    <Label className={formLabelClass}>Reason (optional)</Label>
                    <Input placeholder="Reason (optional)" value={closureReason} onChange={(e) => setClosureReason(e.target.value)} className={formInputClass} />
                  </div>
                  {isAddingClosure && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving closure...
                    </div>
                  )}
                  <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:border-t-0 sm:pt-0">
                    <Button
                      variant="outline"
                      disabled={isAddingClosure}
                      onClick={() => handleCloseClosureModal({ reset: true })}
                      className="h-10 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isAddingClosure}
                      onClick={async () => {
                        const success = await handleAddClosure();
                        if (success) {
                          handleCloseClosureModal({ reset: true });
                        }
                      }}
                      className="h-10 w-full bg-gradient-to-r from-[#009DD1] to-[#0277b8] text-white shadow-sm hover:from-[#028fc0] hover:to-[#016da9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {isAddingClosure ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        'Add Closure'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </TabsContent>

          {/* Appointment Types Tab Content */}
          <TabsContent value="appointment-types" className={tabContentClass}>
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative sm:w-[280px] md:w-[320px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={servicesSearchQuery}
                      onChange={(e) => setServicesSearchQuery(e.target.value)}
                      placeholder="Search services..."
                      className={`${formInputClass} pl-9 pr-9`}
                    />
                    {servicesSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setServicesSearchQuery('')}
                        className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Clear services search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
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
                      handleOpenTypeModal();
                    }}
                    className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto"
                  >
                    Add
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointmentTypes.length === 0 ? (
                  <div className="text-sm text-gray-500">No appointment types configured yet.</div>
                ) : (
                  <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                    <div className="mb-2 hidden grid-cols-[minmax(0,1.6fr)_140px_120px_220px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                      <span>Service</span>
                      <span>Category</span>
                      <span className="text-center">Status</span>
                      <span className="text-center">Actions</span>
                    </div>

                    {filteredAppointmentTypes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                        No matching services found.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {paginatedAppointmentTypes.map((type) => (
                        (() => {
                          const isServiceToggling = serviceStatusLoadingId === type.id;
                          const isServiceDeleting = serviceDeleteLoadingId === type.id;
                          const isServiceDeleteConfirm = serviceDeleteConfirmId === type.id;
                          return (
                        <li
                          key={type.id}
                          className="relative rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.6fr)_140px_120px_220px] md:items-center md:gap-3"
                        >
                          <span
                            className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full md:hidden ${
                              type.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={type.is_active ? 'Active' : 'Inactive'}
                            aria-label={type.is_active ? 'Active service' : 'Inactive service'}
                          />
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

                          <div className="mt-2 flex items-center gap-2 md:mt-0">
                            <div className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-700">
                              {type.category || 'Uncategorized'}
                            </div>
                          </div>

                          <div className="mt-2 hidden md:mt-0 md:block md:justify-self-center">
                            <Badge className={type.is_active ? 'rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs text-green-700' : 'rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600'}>
                              {type.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="mt-2 flex w-full items-center justify-between gap-2 md:mt-0 md:w-auto md:justify-self-center md:justify-center">
                            <div className="flex items-center gap-2">
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
                                  handleOpenTypeModal();
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
                                disabled={isServiceToggling || isServiceDeleting}
                                className={type.is_active ? 'h-8 w-8 rounded-lg p-0 text-amber-700 hover:bg-amber-100' : 'h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100'}
                              >
                                {isServiceToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                            <div className="relative h-8 w-[76px] overflow-hidden">
                              <div
                                className={`absolute right-0 top-0 flex items-center gap-2 transition-all duration-200 ${
                                  isServiceDeleteConfirm ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0 pointer-events-none'
                                }`}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Confirm delete"
                                  onClick={() => handleDeleteAppointmentType(type.id)}
                                  className="h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100"
                                >
                                  {isServiceDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Cancel delete"
                                  onClick={() => setServiceDeleteConfirmId(null)}
                                  disabled={isServiceDeleting}
                                  className="h-8 w-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div
                                className={`absolute right-0 top-0 transition-all duration-200 ${
                                  isServiceDeleteConfirm ? '-translate-y-1 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                                }`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Remove service"
                                  onClick={() => setServiceDeleteConfirmId(type.id)}
                                  disabled={isServiceDeleting}
                                  className="h-8 w-8 rounded-lg border-rose-200 p-0 text-rose-700 hover:bg-rose-50"
                                >
                                  {isServiceDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </li>
                          );
                        })()
                        ))}
                      </ul>
                    )}

                    {filteredAppointmentTypes.length > 0 && (
                      <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          Showing {servicesStartIndex + 1}-{Math.min(servicesStartIndex + servicesPerPage, filteredAppointmentTypes.length)} of {filteredAppointmentTypes.length} services
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
        <TabsContent value="scheduling" className={tabContentClass}>
          <Card className="border-[#97E7F5] shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#01377D] font-semibold">
                  <Clock className="w-5 h-5 text-[#009DD1]" />
                  Booking Interval
                </CardTitle>
                <CardDescription className="text-[#009DD1]">Set the minimum spacing between appointments for all visit types.</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Button
                  onClick={handleSaveInterval}
                  disabled={isSavingInterval}
                  className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isSavingInterval ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save Interval'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 text-xs text-[#0F4C81]">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-cyan-600" />
                  <div>
                    <p className="font-semibold">Meaning of Booking Interval</p>
                    <p className="mt-1 text-[#2F5F87]">
                      Ito ang pagitan (gap) ng available booking slots (e.g. every 15 mins). Hindi ito service duration; service duration comes from each Service&apos;s minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,220px)_1fr] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="interval-input" className={formLabelClass}>Interval (minutes)</Label>
                  <Input
                    id="interval-input"
                    type="number"
                    min={1}
                    value={appointmentInterval}
                    onChange={(e) => handleAppointmentIntervalInputChange(e.target.value)}
                    className={formInputClass}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 30].map((value) => (
                    <button
                      key={`interval-preset-${value}`}
                      type="button"
                      onClick={() => setAppointmentInterval(value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        Number(appointmentInterval) === value
                          ? 'border-[#009DD1] bg-[#009DD1] text-white'
                          : 'border-[#CFE5F7] bg-white text-[#0F4C81] hover:border-[#009DD1] hover:text-[#009DD1]'
                      }`}
                    >
                      {value} mins
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Preview</p>
                <p className="mt-1 text-sm text-[#01377D]">
                  Estimated slots/day:{' '}
                  <span className="font-semibold">
                    {bookingIntervalPreview.slotsPerDay === null ? 'N/A' : bookingIntervalPreview.slotsPerDay}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {bookingIntervalPreview.sample.length > 0 ? (
                    bookingIntervalPreview.sample.map((slot) => (
                      <Badge key={`interval-sample-${slot}`} className="bg-[#EAF5FF] text-[#01377D] hover:bg-[#EAF5FF]">
                        {slot}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">Set valid clinic open/close times to preview slots.</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointment Type Modal */}
        {(showTypeModal || typeModalPhase === 'closing') && (
          <ModalPortal>
            <div
              className={`${typeModalBackdropClass} ${typeModalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`}
              onMouseDown={() => handleCloseTypeModal({ resetEdit: true })}
            >
              <div
                className={`${typeModalPanelClass} ${typeModalPhase === 'open' ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="mb-1 text-lg font-semibold text-[#01377D] sm:text-xl">
                  {editingType ? 'Edit Appointment Type' : 'Add Appointment Type'}
                </h3>
                <p className="mb-3 text-sm text-[#4A6A8F] sm:mb-4">
                  Configure service details, availability window, and scheduling behavior in one form.
                </p>
                <div className="space-y-2">
                  <Label className={formLabelClass}>Type name</Label>
                  <Input value={modalTypeName} onChange={(e) => setModalTypeName(e.target.value)} className={formInputClass} />
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className={formLabelClass}>Category (optional)</Label>
                    <Input
                      value={modalTypeCategory}
                      onChange={(e) => setModalTypeCategory(e.target.value)}
                      placeholder="e.g., Laboratory, Imaging, Serology"
                      className={formInputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={formLabelClass}>Price (PHP)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={modalTypePrice}
                      onChange={(e) => setModalTypePrice(e.target.value)}
                      placeholder="0.00"
                      className={formInputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <Label className={formLabelClass}>Description (optional)</Label>
                  <Input value={modalTypeDescription} onChange={(e) => setModalTypeDescription(e.target.value)} className={formInputClass} />
                </div>
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={formLabelClass}>Available From (optional)</Label>
                      <div className="relative">
                        <Input
                          ref={modalTypeFromRef}
                          type="date"
                          value={modalTypeAvailableFrom}
                          onChange={(e) => setModalTypeAvailableFrom(e.target.value)}
                          className={`${formInputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                        <button
                          type="button"
                          onClick={() => openNativePicker(modalTypeFromRef)}
                          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                          aria-label="Open available from date picker"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={formLabelClass}>Available Until (optional)</Label>
                      <div className="relative">
                        <Input
                          ref={modalTypeUntilRef}
                          type="date"
                          value={modalTypeAvailableUntil}
                          onChange={(e) => setModalTypeAvailableUntil(e.target.value)}
                          className={`${formInputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                        <button
                          type="button"
                          onClick={() => openNativePicker(modalTypeUntilRef)}
                          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                          aria-label="Open available until date picker"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className={formLabelClass}>Daily Start Time (optional)</Label>
                      <div className="relative">
                        <Input
                          ref={modalTypeStartRef}
                          type="time"
                          value={modalTypeStartTime}
                          onChange={(e) => setModalTypeStartTime(e.target.value)}
                          className={`${formInputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                        <button
                          type="button"
                          onClick={() => openNativePicker(modalTypeStartRef)}
                          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                          aria-label="Open daily start time picker"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={formLabelClass}>Daily End Time (optional)</Label>
                      <div className="relative">
                        <Input
                          ref={modalTypeEndRef}
                          type="time"
                          value={modalTypeEndTime}
                          onChange={(e) => setModalTypeEndTime(e.target.value)}
                          className={`${formInputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                        />
                        <button
                          type="button"
                          onClick={() => openNativePicker(modalTypeEndRef)}
                          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-cyan-700"
                          aria-label="Open daily end time picker"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  <Label className={formLabelClass}>Available Days (optional)</Label>
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
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                            selected
                              ? 'border-[#01377D] bg-[#01377D] text-white shadow-sm'
                              : 'border-[#CFE5F7] bg-[#EAF5FF] text-[#01377D] hover:border-[#009DD1] hover:text-[#009DD1]'
                          }`}
                        >
                          {day.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={5}
                      value={modalTypeDuration}
                      onChange={(e) => setModalTypeDuration(Number(e.target.value))}
                      className={`${formInputClass} w-28`}
                    />
                    <span className="text-sm text-[#009DD1]">minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={modalTypeActive} onCheckedChange={setModalTypeActive} id="type-active-switch" />
                    <Label htmlFor="type-active-switch" className="text-sm">Active</Label>
                  </div>
                </div>
                {isSavingTypeModal && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving service type...
                  </div>
                )}
                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:border-t-0 sm:pt-0">
                  <Button
                    variant="outline"
                    disabled={isSavingTypeModal}
                    onClick={() => handleCloseTypeModal({ resetEdit: true })}
                    className="h-10 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSavingTypeModal}
                    onClick={handleSaveTypeModal}
                    className="h-10 w-full bg-gradient-to-r from-[#009DD1] to-[#0277b8] text-white shadow-sm hover:from-[#028fc0] hover:to-[#016da9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSavingTypeModal ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : editingType ? 'Save' : 'Add'}
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
        <TabsContent value="medcert" className={tabContentClass}>
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative sm:w-[280px] md:w-[320px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={reasonsSearchQuery}
                    onChange={(e) => setReasonsSearchQuery(e.target.value)}
                    placeholder="Search certificate types..."
                    className={`${formInputClass} pl-9 pr-9`}
                  />
                  {reasonsSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setReasonsSearchQuery('')}
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Clear medcert type search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <Button onClick={() => handleOpenReasonModal(null)} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Type</Button>
                </div>
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

                  {filteredReasons.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                      No matching certificate types found.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {paginatedReasons.map((r) => (
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

                        <div className="mt-2 flex w-full items-center justify-end gap-2 md:mt-0 md:w-auto md:justify-self-center md:justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit certificate type"
                            onClick={() => handleOpenReasonModal(r)}
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
                  )}

                  {filteredReasons.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Showing {reasonsStartIndex + 1}-{Math.min(reasonsStartIndex + reasonsPerPage, filteredReasons.length)} of {filteredReasons.length} certificate types
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReasonsPage((prev) => Math.max(1, prev - 1))}
                          disabled={reasonsPage === 1}
                          className="h-8 border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-slate-500">
                          Page {reasonsPage} of {totalReasonsPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReasonsPage((prev) => Math.min(totalReasonsPages, prev + 1))}
                          disabled={reasonsPage === totalReasonsPages}
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

        {/* Certificate Type Modal */}
        {(showReasonModal || reasonModalPhase === 'closing') && (
          <ModalPortal>
            <div
              className={`${typeModalBackdropClass} ${reasonModalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`}
              onMouseDown={() => handleCloseReasonModal({ resetEdit: true })}
            >
              <div
                className={`${typeModalPanelClass} max-w-lg ${reasonModalPhase === 'open' ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="mb-1 text-lg font-semibold text-[#01377D] sm:text-xl">
                  {editingReason ? 'Edit Certificate Type' : 'Add Certificate Type'}
                </h3>
                <p className="mb-3 text-sm text-[#4A6A8F] sm:mb-4">
                  Keep your certificate categories organized for faster patient request processing.
                </p>
                <div className="space-y-2">
                  <Label className={formLabelClass}>Certificate Type Name</Label>
                  <Input
                    value={modalReasonText}
                    onChange={(e) => setModalReasonText(e.target.value)}
                    placeholder="e.g., Sick Leave Certificate"
                    className={formInputClass}
                  />
                </div>
                {isSavingReasonModal && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving certificate type...
                  </div>
                )}
                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:border-t-0 sm:pt-0">
                  <Button
                    variant="outline"
                    disabled={isSavingReasonModal}
                    onClick={() => handleCloseReasonModal({ resetEdit: true })}
                    className="h-10 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSavingReasonModal}
                    onClick={handleSaveReasonModal}
                    className="h-10 w-full bg-gradient-to-r from-[#009DD1] to-[#0277b8] text-white shadow-sm hover:from-[#028fc0] hover:to-[#016da9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSavingReasonModal ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : editingReason ? 'Save' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          </ModalPortal>
        )}

        {/* Document Types Tab Content */}
        <TabsContent value="document-types" className={tabContentClass}>
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
                <Button onClick={() => handleOpenDocTypeModal(null)} className="w-full bg-[#009DD1] text-white hover:bg-[#007bb0] sm:w-auto">Add Type</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {documentTypes.length === 0 ? (
                <div className="text-sm text-gray-500">No document types configured yet.</div>
              ) : (
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-3">
                  <div className="mb-2 hidden grid-cols-[minmax(0,1.8fr)_120px_210px] gap-3 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:grid">
                    <span>Document Type</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">Actions</span>
                  </div>

                  <ul className="space-y-2">
                    {documentTypes.map((docType) => (
                      (() => {
                        const isDocToggling = docStatusLoadingId === docType.id;
                        const isDocDeleting = docDeleteLoadingId === docType.id;
                        const isDocDeleteConfirm = docDeleteConfirmId === docType.id;
                        return (
                      <li
                        key={docType.id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3 transition-all hover:border-cyan-200 hover:shadow-sm md:grid md:grid-cols-[minmax(0,1.8fr)_120px_210px] md:items-center md:gap-3"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#01377D]">{docType.name}</div>
                          <div className="mt-0.5 text-xs text-[#009DD1]">
                            Patient upload category for records.
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0 md:justify-self-center">
                          <Badge className={docType.is_active ? 'rounded-full border border-green-200 bg-green-100 px-2.5 py-0.5 text-xs text-green-700' : 'rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600'}>
                            {docType.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 md:mt-0 md:justify-self-center md:justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit document type"
                            onClick={() => handleOpenDocTypeModal(docType)}
                            className="h-8 w-8 rounded-lg p-0 text-cyan-700 hover:bg-cyan-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={docType.is_active ? 'Deactivate document type' : 'Activate document type'}
                            onClick={() => handleToggleDocTypeStatus(docType)}
                            disabled={isDocToggling || isDocDeleting}
                            className={docType.is_active ? 'h-8 w-8 rounded-lg p-0 text-amber-700 hover:bg-amber-100' : 'h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100'}
                          >
                            {isDocToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                          </Button>
                          <div className="relative h-8 w-[76px] overflow-hidden">
                            <div
                              className={`absolute right-0 top-0 flex items-center gap-2 transition-all duration-200 ${
                                isDocDeleteConfirm ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0 pointer-events-none'
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Confirm delete"
                                onClick={() => handleDeleteDocType(docType.id)}
                                className="h-8 w-8 rounded-lg p-0 text-emerald-700 hover:bg-emerald-100"
                              >
                                {isDocDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Cancel delete"
                                onClick={() => setDocDeleteConfirmId(null)}
                                disabled={isDocDeleting}
                                className="h-8 w-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div
                              className={`absolute right-0 top-0 transition-all duration-200 ${
                                isDocDeleteConfirm ? '-translate-y-1 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
                              }`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                title="Remove document type"
                                onClick={() => setDocDeleteConfirmId(docType.id)}
                                disabled={isDocDeleting}
                                className="h-8 w-8 rounded-lg border-rose-200 p-0 text-rose-700 hover:bg-rose-50"
                              >
                                {isDocDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                        );
                      })()
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Type Modal */}
        {(showDocTypeModal || docTypeModalPhase === 'closing') && (
          <ModalPortal>
            <div
              className={`${typeModalBackdropClass} ${docTypeModalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`}
              onMouseDown={() => handleCloseDocTypeModal({ resetEdit: true })}
            >
              <div
                className={`${typeModalPanelClass} max-w-lg ${docTypeModalPhase === 'open' ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'}`}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <h3 className="mb-1 text-lg font-semibold text-[#01377D] sm:text-xl">
                  {editingDocType ? 'Edit Document Type' : 'Add Document Type'}
                </h3>
                <p className="mb-3 text-sm text-[#4A6A8F] sm:mb-4">
                  Define upload categories so patient files stay sorted and easy to review.
                </p>
                <div className="space-y-2">
                  <Label className={formLabelClass}>Document Type Name</Label>
                  <Input
                    value={modalDocTypeName}
                    onChange={(e) => setModalDocTypeName(e.target.value)}
                    placeholder="e.g., Lab Results, Prescription, Insurance Card"
                    className={formInputClass}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                  <Switch checked={modalDocTypeActive} onCheckedChange={setModalDocTypeActive} id="doctype-active-switch" />
                  <Label htmlFor="doctype-active-switch" className="text-sm text-slate-700">Active</Label>
                </div>
                {isSavingDocTypeModal && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving document type...
                  </div>
                )}
                <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end sm:border-t-0 sm:pt-0">
                  <Button
                    variant="outline"
                    disabled={isSavingDocTypeModal}
                    onClick={() => handleCloseDocTypeModal({ resetEdit: true })}
                    className="h-10 w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100 sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSavingDocTypeModal}
                    onClick={handleSaveDocTypeModal}
                    className="h-10 w-full bg-gradient-to-r from-[#009DD1] to-[#0277b8] text-white shadow-sm hover:from-[#028fc0] hover:to-[#016da9] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    {isSavingDocTypeModal ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : editingDocType ? 'Save' : 'Add'}
                  </Button>
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