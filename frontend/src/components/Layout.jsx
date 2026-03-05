import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Calendar,
  ClipboardList,
  UserCircle,
  LogOut,
  Home,
  Activity,
  Upload,
  FileCheck,
  Menu,
  X,
  Shield,
  FileBadge,
  FileEdit,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout, loading, isAdmin, isClinician, isPatient } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [patientMenuOpen, setPatientMenuOpen] = useState(false);
  const [mobilePatientNavHidden, setMobilePatientNavHidden] = useState(false);
  const [showPatientScrollTop, setShowPatientScrollTop] = useState(false);
  const lastPatientScrollTopRef = useRef(0);
  const patientMainRef = useRef(null);
  const isPatientRoute = location.pathname.startsWith('/patient');
  const isClinicianRoute = location.pathname.startsWith('/clinician') || location.pathname.startsWith('/staff');
  const isPatientUser = isPatient || user?.role === 'patient';
  const isClinicianUser = isClinician || user?.role === 'clinician';
  const isPatientLayout = isPatientUser || isPatientRoute;
  const isClinicianLayout = isClinicianUser || isClinicianRoute;
  const isTopNavigationLayout = isPatientLayout || isClinicianLayout;

  const handleLogout = async () => {
    // Open modal confirmation instead of toast
    setLogoutDialogOpen(true);
  };

  const handleProfileClick = () => {
    navigate('/auth/profile');
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const getNavItems = () => {
    if (!user) return [];

    if (isAdmin) {
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/appointments', label: 'Appointments', icon: Calendar },
        { path: '/admin/medcerts', label: 'MedCerts', icon: FileBadge },
        { path: '/admin/manage-users', label: 'Manage Users', icon: Users },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
        { path: '/admin/reports', label: 'Reports', icon: FileText },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
      ];
    } else if (isClinicianLayout) {
      return [
        { path: '/clinician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/clinician/patients', label: 'Patient List', icon: Users },
        { path: '/clinician/schedule', label: 'Schedule', icon: Calendar },
        { path: '/clinician/requests', label: 'Request Management', icon: ClipboardList },
        { path: '/clinician/documents', label: 'Documents', icon: FileText },
        { path: '/clinician/previous-laboratory', label: 'Previous Laboratory', icon: FileBadge },
      ];
    } else if (isPatientLayout) {
      return [
        { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/patient/appointment', label: 'Appointments', icon: Calendar },
        { path: '/patient/request-certificate', label: 'Request Certificate', icon: FileCheck },
        { path: '/patient/upload-document', label: 'Upload Document', icon: Upload },
        { path: '/patient/previous-laboratory', label: 'Previous Laboratory', icon: FileBadge },
        { path: '/patient/records', label: 'Records', icon: FileText },
      ];
    } else {
      return [];
    }
  };

  const navItems = getNavItems();
  const isSidebarCollapsed = sidebarCollapsed;
  const roleLabel = isAdmin ? 'Admin' : isClinician ? 'Clinician' : isPatientLayout ? 'Patient' : 'User';
  const displayBrand = branding.brandName;

  const handlePatientMainScroll = (event) => {
    const currentTop = event.currentTarget.scrollTop;
    const previousTop = lastPatientScrollTopRef.current;
    const isScrollingDown = currentTop > previousTop + 6;
    const isScrollingUp = currentTop < previousTop - 6;

    if (currentTop < 24) {
      setMobilePatientNavHidden(false);
    } else if (isScrollingDown) {
      setMobilePatientNavHidden(true);
    } else if (isScrollingUp) {
      setMobilePatientNavHidden(false);
    }

    if (isTopNavigationLayout) {
      setShowPatientScrollTop(currentTop > 24);
    }

    lastPatientScrollTopRef.current = currentTop;
  };

  const handlePatientScrollToTop = () => {
    patientMainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setShowPatientScrollTop(false);
  };

  useEffect(() => {
    if (!isTopNavigationLayout) return;
    if (!patientMainRef.current) return;

    // Keep hero/banner visible immediately after refresh or route change.
    patientMainRef.current.scrollTo({ top: 0, behavior: 'auto' });
    lastPatientScrollTopRef.current = 0;
    setShowPatientScrollTop(false);
    setMobilePatientNavHidden(false);
  }, [location.pathname, isTopNavigationLayout]);

  useEffect(() => {
    // Prevent stale open drawer state when switching routes on mobile.
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isTopNavigationLayout) {
    const topMainNav = isClinicianLayout
      ? [
          { path: '/clinician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/clinician/schedule', label: 'Schedule', icon: Calendar },
          { path: '/clinician/requests', label: 'Requests', icon: ClipboardList },
        ]
      : [
          { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/patient/appointment', label: 'Appointments', icon: Calendar },
          { path: '/patient/request-certificate', label: 'Request Certificate', icon: FileCheck },
        ];

    const topProfileNav = isClinicianLayout
      ? [
          { path: '/auth/profile', label: 'Profile', icon: UserCircle },
          { path: '/clinician/patients', label: 'Patient List', icon: Users },
          { path: '/clinician/documents', label: 'Documents', icon: FileText },
          { path: '/clinician/previous-laboratory', label: 'Previous Laboratory', icon: FileBadge },
          { path: '/clinician/settings', label: 'Settings', icon: Settings },
        ]
      : [
          { path: '/auth/profile', label: 'Profile', icon: UserCircle },
          { path: '/patient/upload-document', label: 'Upload Document', icon: Upload },
          { path: '/patient/previous-laboratory', label: 'Previous Laboratory', icon: FileBadge },
          { path: '/patient/records', label: 'Records', icon: FileText },
        ];
    const hasPatientNotifications = true;

    return (
      <div className="h-screen min-h-screen overflow-x-hidden bg-gradient-to-b from-[#F7FBFF] via-[#F2F8FF] to-[#ECF4FF] flex flex-col">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[#dbeafe]/80 bg-white/75 backdrop-blur-xl">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-7 w-7 rounded-md object-cover" />
              ) : (
                <Activity className="w-6 h-6 text-[#009DD1]" />
              )}
              <span className="hidden sm:inline text-base font-semibold text-[#01377D]">{displayBrand}</span>
            </div>

            {user && (
              <nav className="hidden flex-1 overflow-x-auto md:block">
                <div className="mx-auto flex min-w-max items-center justify-center gap-1 rounded-full border border-[#DCEBFB] bg-white/70 px-1.5 py-1 shadow-[0_4px_18px_rgba(14,165,233,0.08)] sm:gap-2">
                  {topMainNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group relative flex h-9 shrink-0 items-center gap-2 rounded-full px-2.5 text-xs transition-all duration-300 sm:px-3 sm:text-sm ${
                          isActive
                            ? 'bg-[#EEF6FF] text-[#0F2D57]'
                            : 'text-[#5A6F8F] hover:bg-white hover:text-[#0F2D57]'
                        }`}
                      >
                        <span
                          className="absolute inset-x-3 -bottom-0.5 h-[1.5px] rounded-full bg-[#009DD1] opacity-0 transition-all duration-300 group-hover:opacity-60"
                        />
                        <span className="inline-flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="hidden font-normal tracking-[0.01em] transition-all duration-300 group-hover:tracking-[0.015em] sm:inline">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            )}

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full text-[#4B6386] transition-all duration-300 hover:bg-[#F3F8FF] hover:text-[#01377D]"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {hasPatientNotifications && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ef4444] ring-2 ring-white" />
                )}
              </Button>
              <DropdownMenu open={patientMenuOpen} onOpenChange={setPatientMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full text-[#4B6386] transition-all duration-300 hover:bg-[#F3F8FF] hover:text-[#01377D] ${
                      patientMenuOpen ? 'bg-[#F3F8FF] text-[#01377D] shadow-sm' : ''
                    }`}
                    title="Open menu"
                  >
                    <UserCircle className={`w-5 h-5 transition-transform duration-300 ${patientMenuOpen ? 'scale-105' : 'scale-100'}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 border-[#dbeafe] bg-white/95 backdrop-blur data-[state=open]:duration-200 data-[state=closed]:duration-150"
                >
                  <DropdownMenuLabel className="text-[#01377D]">{user?.name || 'Patient Menu'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {topProfileNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <DropdownMenuItem key={item.path} asChild className="cursor-pointer">
                        <Link
                          to={item.path}
                          className={`flex items-center gap-2 rounded-md px-2 py-2 transition-colors ${
                            isActive ? 'bg-[#F3F8FF] text-[#01377D]' : 'text-[#35507A] hover:text-[#01377D]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main
          ref={patientMainRef}
          className="relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#FAFDFF] via-[#F3F8FF] to-[#ECF4FF] pt-16"
          onScroll={handlePatientMainScroll}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 -left-28 h-72 w-72 rounded-full bg-[#009DD1]/10 blur-3xl" />
            <div className="absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-[#01377D]/10 blur-3xl" />
          </div>
          <div className="relative z-10 p-3 pb-24 sm:p-5 md:pb-5 lg:p-6">{children}</div>
        </main>

        {isTopNavigationLayout && showPatientScrollTop && (
          <Button
            onClick={handlePatientScrollToTop}
            size="icon"
            className="fixed bottom-24 right-4 z-40 h-11 w-11 rounded-full bg-[#01377D] text-white shadow-lg transition-all hover:bg-[#0a4a99] md:bottom-6"
            title="Back to top"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}

        <nav
          className={`fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#DCEBFB] bg-white/90 p-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 md:hidden ${
            mobilePatientNavHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-around gap-1">
            {topMainNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={`mobile-${item.path}`}
                  to={item.path}
                  title={item.label}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[#EAF5FF] text-[#0F2D57]'
                      : 'text-[#5A6F8F] hover:bg-[#F8FBFF] hover:text-[#0F2D57]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </nav>

        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button
                className="bg-red-600 text-white"
                onClick={async () => {
                  try {
                    await logout();
                    setLogoutDialogOpen(false);
                    navigate('/auth/login');
                  } catch (e) {
                    setLogoutDialogOpen(false);
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-transparent bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - FIXED: Changed lg:static to lg:fixed */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-cyan-100/80 bg-gradient-to-b from-[#f8fcff] via-[#f2f8ff] to-[#edf5ff] shadow-[0_16px_35px_rgba(15,23,42,0.08)] backdrop-blur
        transform transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        lg:translate-x-0 lg:fixed lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-cyan-100/80 px-4">
            <div className={`flex items-center ${isSidebarCollapsed ? 'flex-1 justify-center' : 'gap-2'}`}>
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-9 w-9 rounded-xl border border-cyan-100 object-cover shadow-sm" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>
              )}
              <span
                className={`overflow-hidden whitespace-nowrap text-sm font-semibold text-slate-800 transition-all duration-200 ${
                  isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[220px] opacity-100 translate-x-0'
                }`}
              >
                {displayBrand}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* User Info - MADE CLICKABLE */}
          {loading ? (
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ) : user ? (
            <div
              className={`flex-shrink-0 cursor-pointer border-b border-cyan-100/80 p-4 transition-colors hover:bg-cyan-50/70 ${
                isSidebarCollapsed ? 'px-2' : ''
              }`}
              onClick={handleProfileClick}
              title={isSidebarCollapsed ? 'View profile' : undefined}
            >
              <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100/80">
                  <UserCircle className="w-6 h-6 text-cyan-700" />
                </div>
                <div
                  className={`min-w-0 flex-1 overflow-hidden transition-all duration-300 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[200px] opacity-100 translate-x-0'
                  }`}
                >
                  <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{roleLabel}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Navigation */}
          {user && navItems.length > 0 && (
            <nav className={`flex-1 overflow-y-auto py-4 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={isSidebarCollapsed ? 'w-full' : ''}
                  >
                    <Button
                      variant="ghost"
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`group mb-1.5 gap-3 rounded-xl text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#01377D] to-[#0a5fb6] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-cyan-100/70 hover:text-[#01377D]'
                      } ${
                        isSidebarCollapsed
                          ? 'mx-auto h-11 w-11 justify-center gap-0 p-0'
                          : 'w-full justify-start px-3'
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-white text-slate-700 group-hover:scale-105 group-hover:bg-cyan-50 group-hover:text-[#01377D] group-hover:shadow-sm'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                      </span>
                      <span
                        className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 ${
                          isSidebarCollapsed ? 'max-w-0 opacity-0' : 'flex-1 max-w-[180px] opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Sidebar Footer */}
          <div className={`flex-shrink-0 border-t border-cyan-100/80 p-4 ${isSidebarCollapsed ? 'px-2' : ''}`}>
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <Button
                variant="outline"
                className={`w-full gap-3 border-red-200 bg-white/80 text-red-600 hover:bg-red-50 hover:text-red-700 ${
                  isSidebarCollapsed ? 'justify-center px-2' : 'justify-start'
                }`}
                onClick={handleLogout}
                title={isSidebarCollapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-left transition-all duration-200 ${
                    isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'
                  }`}
                >
                  Logout
                </span>
              </Button>
            ) : (
              <div className="space-y-2">
                <Link to="/auth/login" onClick={() => setSidebarOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/auth/signup" onClick={() => setSidebarOpen(false)}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {!isTopNavigationLayout && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute -right-4 bottom-1/4 hidden h-9 w-9 rounded-full border-cyan-200 bg-white text-slate-700 shadow-md hover:bg-cyan-50 hover:text-[#01377D] lg:inline-flex"
            title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-red-600">Confirm Logout</DialogTitle>
              <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button
                className="bg-red-600 text-white"
                onClick={async () => {
                  try {
                    await logout();
                    setLogoutDialogOpen(false);
                    navigate('/auth/login');
                  } catch (e) {
                    // Let logout handle errors; close dialog anyway
                    setLogoutDialogOpen(false);
                  }
                }}
              >
                Logout
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Main Content Area - FIXED: Added lg:ml-64 for fixed sidebar */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-500 ease-in-out ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Mobile Header Only */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-7 w-7 rounded-md object-cover" />
              ) : (
                <Activity className="w-6 h-6 text-green-600" />
              )}
              <span className="text-lg font-semibold text-gray-900">{displayBrand}</span>
            </div>

            {/* Mobile User Actions */}
            {user && (
              <div className="flex items-center gap-2">
                <Link to="/auth/profile">
                  <Button variant="ghost" size="sm">
                    <UserCircle className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-[#f8fcff] via-[#eff6ff] to-[#e8f1ff] transition-colors duration-500">
          <div
            className={`p-4 transition-all duration-500 sm:p-6 lg:p-8 ${
              isSidebarCollapsed ? 'lg:translate-x-1' : 'lg:translate-x-0'
            }`}
          >
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-cyan-100/80 bg-gradient-to-r from-[#edf5ff] to-[#e6f0ff]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
            <p className="text-center text-sm text-slate-700 ">
              © 2025 {displayBrand}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};