import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Activity, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useBranding } from "../../contexts/BrandingContext";

export const Signup = () => {
  const { branding } = useBranding();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    student_number: "",
    date_of_birth: "",
    program: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const displayBrand = branding.brandName;
  const displayShortBrand = branding.brandShortName;
  const displaySystemSubtitle = branding.systemSubtitle;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!formData.student_number) {
      toast.error('Student number is required');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(formData);
      
      if (result.success) {
        toast.success('Account created successfully! Please login to continue.');
        navigate('/auth/login');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
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
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-8 w-8 rounded-md object-cover" />
              ) : (
                <Activity className="w-8 h-8 text-[#d2ffb6]" />
              )}
              <span className="hidden sm:inline text-xl font-bold text-white">{displayBrand}</span>
              <span className="sm:hidden text-sm font-semibold text-white">{displayShortBrand}</span>
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
        <Card className="w-full max-w-2xl border-[#97E7F5] shadow-sm bg-white rounded-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-9 w-9 rounded-md object-cover sm:h-10 sm:w-10" />
            ) : (
              <Activity className="w-9 h-9 sm:w-10 sm:h-10 text-[#26B170]" />
            )}
            <h1 className="text-xl sm:text-2xl font-semibold text-[#01377D]">{displayBrand}</h1>
          </div>
          <CardTitle className="text-[#01377D] font-semibold">Create Account</CardTitle>
          <CardDescription className="text-[#009DD1]">Join University Clinic System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#01377D]">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#01377D]">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#01377D]">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student_number" className="text-[#01377D]">Student Number *</Label>
                <Input
                  id="student_number"
                  name="student_number"
                  type="text"
                  placeholder="STU2024001"
                  value={formData.student_number}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program" className="text-[#01377D]">Program *</Label>
                <Input
                  id="program"
                  name="program"
                  type="text"
                  placeholder="e.g. BS Nursing"
                  value={formData.program || ''}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-[#01377D]">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  required
                  className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1]"
                />
              </div>

            </div>
            

            {/* Password Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 text-[#01377D]">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#01377D]">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
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
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation" className="text-[#01377D]">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Input
                      id="password_confirmation"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      className="border-[#97E7F5] focus:border-[#009DD1] focus:ring-[#009DD1] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#009DD1]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button
                type="submit"
                className="w-full sm:w-auto text-amber-50 bg-green-600 transition-transform duration-300 hover:scale-[1.01] hover:bg-green-700"
                size="lg"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/auth/login" className="text-green-600 hover:underline">
                Login here
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
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={`${displayBrand} logo`} className="h-8 w-8 rounded-md object-cover" />
                ) : (
                  <Activity className="w-8 h-8 text-[#d2ffb6]" />
                )}
                <span className="text-xl font-bold">{displayBrand}</span>
              </div>
              <p className="text-[#97E7F5]">
                {branding.footerDescription}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-[#97E7F5]">
                <li>{displaySystemSubtitle}</li>
                <li>{branding.contactEmail}</li>
                <li>{branding.contactPhone}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#009DD1] mt-8 pt-8 text-center text-[#97E7F5]">
            <p>© 2025 {displayBrand}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
