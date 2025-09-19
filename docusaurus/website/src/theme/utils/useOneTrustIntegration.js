import { useEffect, useState, useCallback, useRef } from 'react';
import {
  loadOneTrustScript,
  hasConsent,
  onAnalyticsConsentChange,
  removeAnalyticsConsentChange,
} from '../utils/oneTrustLoader';

/**
 * Hook that manages OneTrust cookie consent integration.
 * Loads OneTrust script, tracks consent state, and handles consent changes.
 */
export const useOneTrustIntegration = (oneTrustConfig, rudderStackConfig) => {
  const [isOneTrustEnabled, setIsOneTrustEnabled] = useState(false);
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);

  const isRegistered = useRef(false);

  const handleConsentChange = useCallback((groupId, hasConsentValue) => {
    setHasAnalyticsConsent(hasConsentValue);
  }, []);

  useEffect(() => {
    if (!oneTrustConfig.enabled) {
      setIsOneTrustEnabled(false);

      const localConsent = localStorage.getItem('localStorageConsent') === 'true';
      setHasAnalyticsConsent(localConsent);
      return;
    }

    if (isRegistered.current) {
      return;
    }

    setIsOneTrustEnabled(true);
    isRegistered.current = true;

    const existingConsent = hasConsent();
    setHasAnalyticsConsent(existingConsent);

    onAnalyticsConsentChange(handleConsentChange, oneTrustConfig);

    const loaded = loadOneTrustScript(oneTrustConfig);

    return () => {
      removeAnalyticsConsentChange(handleConsentChange);
      isRegistered.current = false;
    };
  }, [oneTrustConfig.enabled, handleConsentChange, oneTrustConfig]);

  return {
    isOneTrustEnabled,
    hasAnalyticsConsent,
  };
};
