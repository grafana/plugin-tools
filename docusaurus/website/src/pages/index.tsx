import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';
import HomepageGettingStarted from '../components/HomepageGettingStarted';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('container margin-top--lg margin-bottom--md', styles.heroContent)}>
      <div className={clsx(styles.heroBanner)}>
        <div className={styles.heroBannerWrapper}>
          <h1 className={clsx('text--normal padding-left--sm', styles.heroSubtitle)}>{siteConfig.tagline}</h1>
          <Link className="margin-left--md button button--primary button--lg" to="/docs/get-started">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`${siteConfig.title}`} description="Set up a Grafana plugin environment effortlessly.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageGettingStarted />
      </main>
    </Layout>
  );
}
