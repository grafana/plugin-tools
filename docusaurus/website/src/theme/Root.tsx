import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useOneTrustIntegration } from './utils/useOneTrustIntegration';
import { CookieConsent } from '../components/CookieConsent/CookieConsent';
import { FaroConfig, RudderStackTrackingConfig, startTracking, trackPage } from './tracking';
import { analyticsVersion, cookieName, getCookie, setCookie } from './tracking/cookie';

export default function Root({ children }) {
  const location = useLocation();
  const {
    siteConfig: { customFields },
  } = useDocusaurusContext();

  const { isOneTrustEnabled, hasAnalyticsConsent } = useOneTrustIntegration(customFields.oneTrust);

  const rudderStackConfig = customFields.rudderStackTracking as RudderStackTrackingConfig;
  const faroConfig = customFields.faroConfig as FaroConfig;
  const shouldTrack = customFields.nodeEnv === 'production';

  const setCookieAndStartTracking = useCallback(() => {
    setCookie(cookieName, {
      analytics: analyticsVersion,
    });

    setShouldShow(false);
    startTracking(rudderStackConfig, faroConfig, shouldTrack);
  }, [rudderStackConfig, faroConfig, shouldTrack]);

  const [shouldShow, setShouldShow] = useState(false);

  const canSpam = useCallback(async () => {
    try {
      const response = await fetch(customFields.canSpamUrl as string, { mode: 'no-cors' });
      if (response.status === 204) {
        return true;
      }
    } catch (e) {
      // do nothing
    }
    return false;
  }, [customFields.canSpamUrl]);

  const onClick = () => {
    return setCookieAndStartTracking();
  };

  useEffect(() => {
    if (isOneTrustEnabled) {
      return;
    }

    // If the user has already given consent, start tracking.
    if (getCookie(cookieName, 'analytics') === analyticsVersion) {
      return setCookieAndStartTracking();
    }

    // If the user is from an IP address that does not require consent, start tracking.
    canSpam()
      .then((result) => {
        if (result) {
          return setCookieAndStartTracking();
        } else {
          // If the user has not given consent and is from IP address that requires consent, show the consent banner.
          setShouldShow(true);
        }
      })
      .catch((error) => {
        console.error(error);
        setShouldShow(true);
      });
  }, [isOneTrustEnabled, setCookieAndStartTracking, canSpam]);

  useEffect(() => {
    const shouldTrack = isOneTrustEnabled
      ? hasAnalyticsConsent
      : getCookie(cookieName, 'analytics') === analyticsVersion;

    if (shouldTrack) {
      if (isOneTrustEnabled && hasAnalyticsConsent) {
        startTracking(rudderStackConfig, faroConfig, shouldTrack);
      }
      trackPage();
    }
  }, [location, hasAnalyticsConsent, isOneTrustEnabled, rudderStackConfig, faroConfig, shouldTrack]);

  return (
    <>
      {children}
      {!isOneTrustEnabled && shouldShow && <CookieConsent onClick={onClick} />}
    </>
  );
}
