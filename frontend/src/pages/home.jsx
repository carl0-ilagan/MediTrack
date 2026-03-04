import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  Users,
  Shield,
  Settings,
  PenTool,
  Search,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'resources', label: 'Resources' },
  { id: 'libraries', label: 'Features' },
  { id: 'stats', label: 'Stats' },
  { id: 'access', label: 'Quick Access' },
];

const serviceCards = [
  {
    id: 'patients',
    title: 'Patients',
    icon: Users,
    color: 'text-[#009DD1]',
    iconBg: 'bg-[#009DD1]/10',
    description: 'Book appointments, access records, and manage health documents online.',
    highlights: ['Online booking', 'Records access', 'Certificate requests'],
  },
  {
    id: 'clinicians',
    title: 'Clinicians',
    icon: Shield,
    color: 'text-[#26B170]',
    iconBg: 'bg-[#26B170]/10',
    description: 'Manage schedules, review requests, and streamline patient workflows.',
    highlights: ['Patient queue', 'Request approvals', 'Schedule controls'],
  },
  {
    id: 'administrators',
    title: 'Administrators',
    icon: Settings,
    color: 'text-[#7ED348]',
    iconBg: 'bg-[#7ED348]/20',
    description: 'Configure services and keep clinic operations secure and efficient.',
    highlights: ['Reports', 'User management', 'System settings'],
  },
  {
    id: 'staff',
    title: 'Medical Staff',
    icon: PenTool,
    color: 'text-[#009DD1]',
    iconBg: 'bg-[#009DD1]/10',
    description: 'Capture visit updates and coordinate care in real time.',
    highlights: ['Visit notes', 'Document updates', 'Care coordination'],
  },
];

const Home = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedService, setSelectedService] = useState('patients');
  const [statsInView, setStatsInView] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({ patients: 0, sessions: 0, appointments: 0, uptime: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.id);
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const stats = document.getElementById('stats');
    if (!stats) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStatsInView(true);
    }, { threshold: 0.35 });
    observer.observe(stats);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!statsInView) return;
    const duration = 900;
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setAnimatedStats({
        patients: Math.round(2845 * p),
        sessions: Math.round(1234 * p),
        appointments: Math.round(456 * p),
        uptime: Number((99.8 * p).toFixed(1)),
      });
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [statsInView]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return serviceCards;
    return serviceCards.filter((card) => `${card.title} ${card.description} ${card.highlights.join(' ')}`.toLowerCase().includes(q));
  }, [serviceQuery]);

  const focusedService = serviceCards.find((item) => item.id === selectedService) || serviceCards[0];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-[#01377D] shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            <button className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
              <Activity className="w-8 h-8 text-[#d2ffb6]" />
              <span className="hidden sm:inline text-xl font-bold text-white">Clinic and Laboratory</span>
              <span className="sm:hidden text-sm font-semibold text-white">Clinic Lab</span>
            </button>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`font-medium transition-colors duration-300 pb-1 ${activeSection === id ? 'text-[#d2ffb6] border-b-2 border-[#d2ffb6]' : 'text-[#97E7F5] hover:text-[#d2ffb6]'}`}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/auth/login"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-[#97E7F5] hover:text-[#d2ffb6] font-medium transition-all duration-300 border border-[#97E7F5]/50 sm:border-0 rounded-md"
              >
                Login
              </Link>
              <Link
                to="/auth/signup"
                className="px-3 sm:px-6 py-2 text-xs sm:text-sm bg-[#26B170] text-white rounded-md sm:rounded-lg font-semibold hover:bg-[#d2ffb6] hover:text-[#26B170] transition-all duration-300"
              >
                Sign Up
              </Link>
              <button className="md:hidden p-2 text-[#97E7F5] hover:text-[#d2ffb6]" onClick={() => setMobileMenuOpen((p) => !p)} aria-label="Toggle navigation menu">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <div
            className={`md:hidden border-t border-[#1f4f93] bg-[#01377D] px-4 overflow-hidden transition-all duration-300 ease-out ${
              mobileMenuOpen ? 'max-h-80 py-3 opacity-100 translate-y-0' : 'max-h-0 py-0 opacity-0 -translate-y-1'
            }`}
          >
            <div className="flex flex-col gap-2">
              {navItems.map(({ id, label }) => (
                <button
                  key={`m-${id}`}
                  onClick={() => scrollToSection(id)}
                  className={`w-full rounded-md px-4 py-2.5 text-sm text-left font-medium transition-colors ${
                    activeSection === id ? 'bg-[#0d4e9b] text-[#d2ffb6]' : 'text-[#97E7F5] hover:bg-[#0d4e9b]/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section id="home" className="bg-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-[#009DD1] mb-6 leading-tight">
                <span className="block">Modern Healthcare,</span>
                <span className="block text-[#01377D]">Better Tomorrow</span>
              </h1>
              <p className="text-xl text-[#01377D] mb-8 max-w-2xl">Simplifying healthcare management for better patient care with booking, records, and documents in one place.</p>
              <div className="mb-8 max-w-xl mx-auto lg:mx-0">
                <div className="relative group">
                  <input
                    type="text"
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    onFocus={() => scrollToSection('resources')}
                    placeholder="Search services or roles..."
                    className="w-full px-6 py-4 pl-12 rounded-lg border-2 border-[#009DD1]/30 focus:border-[#26B170] focus:ring-4 focus:ring-[#97E7F5]/50 transition-all duration-300 text-lg shadow-lg group-hover:shadow-xl bg-white"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#009DD1] w-5 h-5" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/auth/signup" className="bg-[#26B170] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#7ED348] hover:scale-105 active:scale-95 shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
                  <Users className="w-5 h-5" />
                  Get Started
                </Link>
                <button onClick={() => scrollToSection('resources')} className="border-2 border-[#009DD1] text-[#009DD1] px-8 py-4 rounded-lg font-semibold hover:bg-[#009DD1] hover:text-white hover:scale-105 active:scale-95 shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
                  <BookOpen className="w-5 h-5" />
                  Explore Services
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-0 transform hover:scale-105 transition-transform duration-500">
                <div className="relative rounded-xl overflow-hidden">
                  <img src="https://i.pinimg.com/1200x/55/81/80/558180f961f4da7db384c55903ae464c.jpg" alt="Healthcare Management" className="w-full h-[600px] object-cover transform hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 flex items-end z-10">
                    <div className="p-4 text-[#009DD1] bg-white/90 w-full">
                      <h3 className="text-lg font-bold">Clinic and Laboratory System</h3>
                      <p className="text-sm opacity-90">University Health Services</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="resources" className="py-20 bg-[#97E7F5]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#01377D] mb-4"><span className="text-[#009DD1]">Our</span> Services</h2>
            <p className="text-xl text-[#01377D] max-w-3xl mx-auto">Interactive service cards to quickly understand each role.</p>
          </div>
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {serviceCards.map((card) => (
              <button key={card.id} onClick={() => setSelectedService(card.id)} className={`rounded-full border px-4 py-2 text-sm font-medium ${selectedService === card.id ? 'border-[#009DD1] bg-[#EAF5FF] text-[#01377D]' : 'border-[#D8EBFA] bg-white text-[#35507A]'}`}>{card.title}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredServices.map((card) => {
              const Icon = card.icon;
              return (
                <button key={card.id} onClick={() => setSelectedService(card.id)} className={`bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl border-2 transition-all duration-300 transform hover:-translate-y-2 ${selectedService === card.id ? 'border-[#26B170]' : 'border-transparent'}`}>
                  <div className={`w-20 h-20 ${card.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <Icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-[#01377D] mb-4">{card.title}</h3>
                  <p className="text-[#01377D] leading-relaxed">{card.description}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl border border-[#D8EBFA] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#01377D] mb-3">{focusedService.title} Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {focusedService.highlights.map((item) => (
                <div key={item} className="rounded-lg bg-[#F7FBFF] border border-[#E1F1FC] px-4 py-3 text-[#35507A]">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="libraries" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-[#97E7F5]/30 via-[#009DD1]/10 to-[#26B170]/10 rounded-3xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg"><BookOpen className="w-10 h-10 text-[#009DD1] mb-4" /><h4 className="font-semibold text-[#01377D]">Digital Records</h4></div>
                <div className="bg-white rounded-2xl p-6 shadow-lg"><Calendar className="w-10 h-10 text-[#26B170] mb-4" /><h4 className="font-semibold text-[#01377D]">Easy Booking</h4></div>
                <div className="bg-white rounded-2xl p-6 shadow-lg"><Search className="w-10 h-10 text-[#7ED348] mb-4" /><h4 className="font-semibold text-[#01377D]">Quick Access</h4></div>
                <div className="bg-white rounded-2xl p-6 shadow-lg"><Clock className="w-10 h-10 text-[#009DD1] mb-4" /><h4 className="font-semibold text-[#01377D]">24/7 Available</h4></div>
              </div>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-4xl font-bold text-[#01377D] mb-6"><span className="text-[#009DD1]">Our</span> Features</h2>
              <p className="text-lg text-[#01377D] mb-8 leading-relaxed">Access medical history, book appointments, and manage health documents in one secure platform.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[#26B170]"><CheckCircle className="w-5 h-5" /><span>Secure electronic health records</span></div>
                <div className="flex items-center gap-3 text-[#26B170]"><CheckCircle className="w-5 h-5" /><span>Online appointment scheduling</span></div>
                <div className="flex items-center gap-3 text-[#26B170]"><CheckCircle className="w-5 h-5" /><span>Instant certificate requests</span></div>
              </div>
              <div className="mt-8">
                <Link to="/auth/signup" className="inline-flex bg-[#26B170] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#7ED348] shadow-lg transition-all duration-300 items-center gap-3">
                  <ArrowRight className="w-5 h-5" />
                  Explore Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="py-16 bg-[#009DD1] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold mb-2 text-[#aaff75]">{animatedStats.patients.toLocaleString()}</div><p>Total Patients</p></div>
            <div><div className="text-4xl font-bold mb-2 text-[#aaff75]">{animatedStats.sessions.toLocaleString()}</div><p>Active Sessions</p></div>
            <div><div className="text-4xl font-bold mb-2 text-[#aaff75]">{animatedStats.appointments.toLocaleString()}</div><p>Appointments Today</p></div>
            <div><div className="text-4xl font-bold mb-2 text-[#aaff75]">{animatedStats.uptime}%</div><p>System Uptime</p></div>
          </div>
        </div>
      </section>

      <section id="access" className="py-20 bg-[#97E7F5]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#01377D] mb-4"><span className="text-[#009DD1]">Quick</span> Access</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/auth/login" className="p-8 bg-white rounded-2xl shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#26B170]">
              <Search className="w-6 h-6 text-[#009DD1] mb-4" />
              <h3 className="text-xl font-semibold text-[#01377D] mb-2">Book Appointment</h3>
              <p className="text-[#01377D] text-sm">Schedule your visit quickly.</p>
            </Link>
            <Link to="/auth/login" className="p-8 bg-white rounded-2xl shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#7ED348]">
              <Clock className="w-6 h-6 text-[#7ED348] mb-4" />
              <h3 className="text-xl font-semibold text-[#01377D] mb-2">Clinic Hours</h3>
              <p className="text-[#01377D] text-sm">Mon-Fri: 8AM-5PM, Sat: 9AM-12PM.</p>
            </Link>
            <Link to="/auth/signup" className="p-8 bg-white rounded-2xl shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#26B170]">
              <Users className="w-6 h-6 text-[#26B170] mb-4" />
              <h3 className="text-xl font-semibold text-[#01377D] mb-2">Get Started</h3>
              <p className="text-[#01377D] text-sm">Create your account in minutes.</p>
            </Link>
            <Link to="/auth/login" className="p-8 bg-white rounded-2xl shadow-lg transition-all duration-300 border-2 border-transparent hover:border-[#009DD1]">
              <Calendar className="w-6 h-6 text-[#009DD1] mb-4" />
              <h3 className="text-xl font-semibold text-[#01377D] mb-2">My Records</h3>
              <p className="text-[#01377D] text-sm">View your health history securely.</p>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#01377D] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4"><Activity className="w-8 h-8 text-[#7ED348]" /><span className="text-xl font-bold">Clinic and Laboratory</span></div>
              <p className="text-[#97E7F5]">Modern healthcare management for better care and operations.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-[#97E7F5]">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-[#7ED348]">Home</button></li>
                <li><button onClick={() => scrollToSection('resources')} className="hover:text-[#7ED348]">Services</button></li>
                <li><button onClick={() => scrollToSection('libraries')} className="hover:text-[#7ED348]">Features</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-[#97E7F5]"><li>University Health Center</li><li>clinic@university.edu</li><li>(123) 456-7890</li></ul>
            </div>
          </div>
          <div className="border-t border-[#009DD1] mt-8 pt-8 text-center text-[#97E7F5]"><p>© 2025 Clinic and Laboratory. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  );
};

export default Home;