import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useLocation } from '@docusaurus/router';
import { useStorageSlot } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { faro } from '@grafana/faro-web-sdk';
import { Button } from '@site/src/components/Button/Button';
import { FaroConfig, isFaroSetup } from '@site/src/theme/tracking';
import ThumbsUp from '@site/static/img/thumbs-up.svg';

export function Rating() {
  const {
    siteConfig: { customFields },
  } = useDocusaurusContext();
  const { pathname } = useLocation();
  const pageId = pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_');
  const [storageValue, setStorageValue] = useRatingStorage(pageId);
  const faroIsConfigured = isFaroSetup(customFields.faroConfig as FaroConfig);
  const shouldTrack = customFields.nodeEnv === 'production';
  const onClick = (rating: string) => {
    if (shouldTrack && faroIsConfigured) {
      faro.api.pushMeasurement(
        {
          type: 'docs_feedback',
          // website doesn't include this but pushMeasurement types require it
          values: {
            rating: rating === 'yes' ? 1 : 0,
          },
        },
        {
          context: {
            page: pathname,
            rating: rating,
          },
        }
      );
    }
    setStorageValue(rating);
  };

  return (
    <div className="row row--no-gutters row--align-baseline margin-bottom--lg justify--between">
      <h3 className="margin-bottom--none margin-top--md">Was this page helpful?</h3>
      <div className={clsx('margin-top--sm', storageValue && 'cursor--not-allowed')}>
        <div className={clsx('row row--no-gutters gap', storageValue && 'pointer-events--none')}>
          <Button
            active={storageValue === 'yes'}
            onClick={() => onClick('yes')}
            disabled={storageValue === 'yes'}
            className="align--center"
          >
            <ThumbsUp width="16px" height="16px" /> Yes
          </Button>
          <Button active={storageValue === 'no'} onClick={() => onClick('no')} disabled={storageValue === 'no'}>
            <ThumbsUp className="scale-rotate" width="16px" height="16px" /> No
          </Button>
        </div>
      </div>
    </div>
  );
}

function getStorageKey(pageId: string | undefined) {
  if (!pageId) {
    return null;
  }
  return `docusaurus.plugin-tools.page-rating.${pageId}`;
}

function useRatingStorage(pageId: string | undefined) {
  const key = getStorageKey(pageId);
  const [value, storageSlot] = useStorageSlot(key);

  const setValue = useCallback(
    (newValue: string) => {
      if (!key) {
        return; // no-op
      }
      storageSlot.set(newValue);
    },
    [key, storageSlot]
  );

  return [value, setValue] as const;
}
