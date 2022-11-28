import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;

  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    description: (
      <>
        No need to learn and configure all the build tools necessary to build a Grafana plugin. Instant plugin
        development environment helps you focus on coding. Easily distribute your plugin with Github workflows.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    description: <>What does matter though?</>,
  },
  {
    title: 'Transparency',

    description: (
      <>
        Under the hood we use webpack, swc, eslint, and other amazing open source projects to help you build your
        plugins. Everything is available as standard configs for you to extend as you please.
      </>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
