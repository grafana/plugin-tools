import React, { useEffect, useState } from 'react';
import { useLocation } from '@docusaurus/router';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { CookieConsent } from '../components/CookieConsent/CookieConsent';
import { RudderStackTrackingConfig, startTracking, trackPage } from './tracking';
import { analyticsVersion, cookieName, getCookie, setCookie } from './tracking/cookie';

export default function Root({ children }) {
  const location = useLocation();
  const {
    siteConfig: { customFields },
  } = useDocusaurusContext();

  const rudderStackConfig = customFields.rudderStackTracking as RudderStackTrackingConfig;

  const setCookieAndStartTracking = () => {
    setCookie(cookieName, {
      analytics: analyticsVersion,
    });

    setShouldShow(false);
    startTracking(rudderStackConfig);
  };

  const [shouldShow, setShouldShow] = useState(false);

  const canSpam = async () => {
    try {
      const response = await fetch(customFields.canSpamUrl as string, { mode: 'no-cors' });
      if (response.status === 204) {
        return true;
      }
    } catch (e) {
      // do nothing
    }
    return false;
  };

  const onClick = () => {
    return setCookieAndStartTracking();
  };

  useEffect(() => {
    // If the user has already given consent, start tracking.
    if (getCookie(cookieName, 'analytics') === analyticsVersion) {
      return setCookieAndStartTracking();
    }

    // If the user is from an IP address that does not require consent, start tracking.
    canSpam()
      .then((result) => {
        if (result) {
          return setCookieAndStartTracking();
        }
      })
      .catch(console.error);

    // If the user has not given consent and is from IP address that requires consent, show the consent banner.
    setShouldShow(true);
  }, []);

  useEffect(() => {
    trackPage();
  }, [location]);

  return (
    <>
      {children}
      {shouldShow && <CookieConsent onClick={onClick} />}
    </>
  );
}
