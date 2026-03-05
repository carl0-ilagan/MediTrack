import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getClinicBranding } from '../api/Clinic';

const defaultBranding = {
  brandName: '',
  brandShortName: '',
  systemTitle: '',
  systemSubtitle: '',
  logoUrl: null,
  footerDescription: '',
  contactEmail: '',
  contactPhone: '',
};

const BrandingContext = createContext({
  branding: defaultBranding,
  loading: true,
  reloadBranding: async () => {},
  applyBrandingFromSettings: () => {},
});

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);

  const applyBrandingFromSettings = useCallback((settings) => {
    if (!settings) return;
    setBranding({
      brandName: settings.brand_name || '',
      brandShortName: settings.brand_short_name || '',
      systemTitle: settings.system_title || '',
      systemSubtitle: settings.system_subtitle || '',
      logoUrl: settings.brand_logo_url || null,
      footerDescription: settings.footer_description || '',
      contactEmail: settings.contact_email || '',
      contactPhone: settings.contact_phone || '',
    });
  }, []);

  const reloadBranding = useCallback(async () => {
    try {
      const response = await getClinicBranding();
      const settings = response?.data?.data?.settings || response?.data?.settings || null;
      if (settings) {
        applyBrandingFromSettings(settings);
      } else {
        setBranding(defaultBranding);
      }
    } catch (error) {
      setBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  }, [applyBrandingFromSettings]);

  useEffect(() => {
    reloadBranding();
  }, [reloadBranding]);

  const value = useMemo(
    () => ({
      branding,
      loading,
      reloadBranding,
      applyBrandingFromSettings,
    }),
    [branding, loading, reloadBranding, applyBrandingFromSettings]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);
