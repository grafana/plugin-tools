import React, { ComponentType, SVGProps } from 'react';
import clsx from 'clsx';
import EasyUseIcon from '@iconscout/unicons/svg/line/user-check.svg';
import FocusIcon from '@iconscout/unicons/svg/line/focus-target.svg';
import TransparentIcon from '@iconscout/unicons/svg/line/eye.svg';

type FeatureItem = {
  title: string;
  description: string;
  href?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    description:
      'No need to learn and configure all the build tools necessary to build a Grafana plugin. Instant plugin development environment helps you focus on coding. Easily distribute your plugin with Github workflows.',
    Icon: EasyUseIcon,
  },
  {
    title: 'Focus on What Matters',
    description:
      'Spend time where it matters - desiging and developing a Grafana plugin. Take advantage of unit and e2e testing to make sure your plugin is rock solid.',
    Icon: FocusIcon,
  },
  {
    title: 'Transparency',
    description:
      'Under the hood we use webpack, swc, eslint, and other amazing open source projects to help you build your plugins. Everything is available as standard configs for you to extend as you please.',
    Icon: TransparentIcon,
  },
];

function Feature({ title, description, href, Icon }: FeatureItem) {
  return (
    <div className="col">
      <div className={clsx('card card--full-height padding--md')}>
        <span className="avatar margin-bottom--sm">
          {Icon && <Icon aria-hidden="true" style={{ fill: 'currentColor', width: 24 }} />}
          <h3 className="margin-bottom--none text--normal">{title}</h3>
        </span>
        <p className="margin-bottom--none">{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="margin-bottom--lg">
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
