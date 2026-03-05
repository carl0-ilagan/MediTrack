import React from "react";
import { Star, Info, Mail, Rocket } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useBranding } from "../contexts/BrandingContext";

export const Navbar = () => {
  const { branding } = useBranding();
  const linkClasses =
    "text-green-700 hover:text-green-800 transition-colors font-medium";
  const displayBrand = branding.brandName;

  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // update hash without jumping
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="w-full flex items-center justify-between px-6 md:px-12 lg:px-20 xl:px-32 py-4 sticky top-0 z-50 hidden md:flex bg-white shadow-sm border-b h-screen border-gray-100">
        {/* Left - Logo */}
        <h1 className="text-3xl font-bold text-green-700">{displayBrand}</h1>

        {/* Center - Navigation Links */}
        <div className="flex items-center space-x-8">
          <a href="#home" onClick={(e) => scrollTo(e, 'home')} className={linkClasses}>
            Home
          </a>

          <a href="#services" onClick={(e) => scrollTo(e, 'services')} className={linkClasses}>
            Services
          </a>

          <a href="#stats" onClick={(e) => scrollTo(e, 'stats')} className={linkClasses}>
            Stats
          </a>

          <a href="#quick-access" onClick={(e) => scrollTo(e, 'quick-access')} className={linkClasses}>
            Quick Access
          </a>
        </div>

        {/* Right - Button */}
        <NavLink to="/car-form" className="bg-green-800 text-white px-5 py-2 rounded-full hover:bg-green-900 transition-colors duration-200 font-semibold">Get Started</NavLink>
      </nav>

        {/* Mobile Navbar (bottom) */}
      <nav className="w-full flex justify-around items-center px-4 py-3 bg-white md:hidden fixed bottom-0 left-0 z-50 border-t border-green-100 shadow-lg">
        <a href="#home" onClick={(e) => scrollTo(e, 'home')} className="flex flex-col items-center text-green-700 hover:text-green-800 transition-colors font-medium">
          <Star className="w-6 h-6 mb-0.5" />
          <span className="text-xs">Home</span>
        </a>
        <a href="#services" onClick={(e) => scrollTo(e, 'services')} className="flex flex-col items-center text-green-700 hover:text-green-800 transition-colors font-medium">
          <Info className="w-6 h-6 mb-0.5" />
          <span className="text-xs">Services</span>
        </a>
        <a href="#quick-access" onClick={(e) => scrollTo(e, 'quick-access')} className="flex flex-col items-center text-green-700 hover:text-green-800 transition-colors font-medium">
          <Mail className="w-6 h-6 mb-0.5" />
          <span className="text-xs">Access</span>
        </a>
        <a href="#contact" onClick={(e) => scrollTo(e, 'contact')} className="flex flex-col items-center">
          <span className="bg-green-800 rounded-full p-2 shadow flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </span>
          <span className="text-xs text-green-800 font-semibold mt-0.5">Contact</span>
        </a>
      </nav>
    </>
  );
};

export default Navbar;
