import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeSnippets from '../CodeSnippets/CodeSnippets';

import styles from './styles.module.css';
import ScaffoldNPM from '@snippets/createplugin-scaffold.npm.md';
import UpdateNPM from '@snippets/createplugin-update.npm.md';

function HomepageGettingStarted() {
  return (
    <>
      <div className={styles.gettingStartedSection}>
        <div className="container padding-vert--xl text--left">
          <div className="row">
            <div className="col col--4 col--offset-1">
              <h2>Get started in seconds</h2>
              <p>
                Whether you’re building an app, datasource or panel plugin, Create Plugin lets you{' '}
                <strong>focus on code, not build tools</strong>.
                <br />
                <br />
                To create a plugin run this command:
              </p>
              <CodeSnippets snippets={[{ component: ScaffoldNPM }]} />
              <br />
            </div>
            <div className="col col--6 col--offset-1">
              <img
                className={styles.featureImage}
                alt="Easy to get started in seconds"
                src={useBaseUrl('img/homepage_gettingstarted.gif')}
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="container padding-vert--xl text--left">
          <div className="row">
            <div className="col col--6 col--offset-1">
              <img className={styles.featureImage} alt="Easy to update" src={useBaseUrl('img/homepage_update.gif')} />
            </div>
            <div className="col col--4 col--offset-1">
              <h2>Easy to Maintain</h2>
              <p>
                Updating your build tooling can be a daunting and time-consuming task. When new versions of Create
                Plugin are released, you can upgrade using a single command:
              </p>
              <CodeSnippets snippets={[{ component: UpdateNPM }]} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomepageGettingStarted;
