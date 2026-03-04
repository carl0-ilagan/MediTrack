import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Activity, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, isAdmin, isClinician, isPatient } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous error messages
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });
      if (result.success) {
        const returnedUser = result.data;

        // If backend returned a user object, use it directly to decide where to go.
        // This avoids timing issues where context-derived booleans may not be updated yet.
        if (returnedUser) {
          navigateBasedOnRole(returnedUser);
        } else {
          // Small delay to allow AuthContext to update before navigation
          setTimeout(() => {
            navigateBasedOnRole();
          }, 100);
        }
      } else {
        setErrorMessage(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ LOGIN: Login error:', error);
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateBasedOnRole = (returnedUser) => {
    // decide role-based navigation

    // Determine roles from returned user when available, otherwise use context booleans
    let isAdminLocal = false;
    let isClinicianLocal = false;
    let isPatientLocal = false;

    if (returnedUser) {
      // returnedUser may have `roles` (array) or `role` (string)
      const roleNames = [];
      if (Array.isArray(returnedUser.roles)) {
        returnedUser.roles.forEach(r => {
          if (r && r.name) roleNames.push(r.name);
        });
      }
      if (returnedUser.role && typeof returnedUser.role === 'string') {
        roleNames.push(returnedUser.role);
      }

      isAdminLocal = roleNames.includes('admin');
      isClinicianLocal = roleNames.includes('clinician');
      isPatientLocal = roleNames.includes('patient');
    } else {
      isAdminLocal = !!isAdmin;
      isClinicianLocal = !!isClinician;
      isPatientLocal = !!isPatient;
    }

    if (isAdminLocal) {
      navigate('/admin/dashboard');
    } else if (isClinicianLocal) {
      navigate('/clinician/dashboard');
    } else if (isPatientLocal) {
      navigate('/patient/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#01377D] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-[#d2ffb6]" />
              <span className="hidden sm:inline text-xl font-bold text-white">Clinic and Laboratory</span>
              <span className="sm:hidden text-sm font-semibold text-white">Clinic Lab</span>
            </Link>

            {/* Auth Buttons */}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-[80vh] flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md border-[#97E7F5] shadow-sm bg-white rounded-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Activity className="w-9 h-9 sm:w-10 sm:h-10 text-[#26B170]" />
            <h1 className="text-xl sm:text-2xl font-semibold text-[#01377D]">Clinic and Laboratory</h1>
          </div>
          <CardTitle className="text-[#01377D] font-semibold">Login</CardTitle>
          <CardDescription className="text-[#009DD1]">Access your Clinic and Laboratory account</CardDescription>
        </CardHeader>
        
        {errorMessage && (
          <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-md mx-6 mb-4">
            <p className="text-sm text-red-600 font-light">{errorMessage}</p>
          </div>
        )}
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#01377D]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                required
                disabled={loading}
                className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#01377D]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  required
                  disabled={loading}
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#009DD1]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/auth/forgot-password" className="text-sm text-[#009DD1] hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="text-center">
              <Button 
                type="submit" 
                className="w-full bg-[#26B170] text-white transition-transform duration-300 hover:scale-[1.01] hover:bg-[#7ED348]" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/auth/signup" className="text-[#009DD1] hover:underline">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>

      {/* Footer */}
      <footer className="bg-[#01377D] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-8 h-8 text-[#d2ffb6]" />
                <span className="text-xl font-bold">Clinic and Laboratory</span>
              </div>
              <p className="text-[#97E7F5]">
                Modern healthcare management system for better patient care and clinic operations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-[#97E7F5]">
                <li>University Health Center</li>
                <li>clinic@university.edu</li>
                <li>(123) 456-7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#009DD1] mt-8 pt-8 text-center text-[#97E7F5]">
            <p>© 2025 Clinic and Laboratory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;