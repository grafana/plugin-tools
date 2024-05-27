# v4.11.1 (Mon May 27 2024)

#### 🐛 Bug Fix

- Create plugin: use existing executable name on update [#924](https://github.com/grafana/plugin-tools/pull/924) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.11.0 (Mon May 27 2024)

#### 🚀 Enhancement

- Create-plugin: stop extracting plugin-meta on builds [#923](https://github.com/grafana/plugin-tools/pull/923) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.10.6 (Mon May 27 2024)

#### 🐛 Bug Fix

- Create plugin: CI workflow improvements [#890](https://github.com/grafana/plugin-tools/pull/890) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v4.10.5 (Fri May 24 2024)

#### 🐛 Bug Fix

- Create Plugin: Improve handling of e2e in update cmd [#920](https://github.com/grafana/plugin-tools/pull/920) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v4.10.4 (Thu May 16 2024)

#### 🐛 Bug Fix

- Create plugin: Disable development mode by default [#910](https://github.com/grafana/plugin-tools/pull/910) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.10.3 (Wed May 08 2024)

#### 🐛 Bug Fix

- CreatePlugin: Updating template to use latest version of plugin meta extractor [#905](https://github.com/grafana/plugin-tools/pull/905) ([@mckn](https://github.com/mckn))

#### Authors: 1

- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v4.10.1 (Tue May 07 2024)

#### 🐛 Bug Fix

- Create Plugin: polyfill `TextEncoder` for Jest tests in scaffolded plugins [#899](https://github.com/grafana/plugin-tools/pull/899) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.10.0 (Mon May 06 2024)

#### 🚀 Enhancement

- Webpack: Generate meta-data using the plugin-meta-extractor during builds [#871](https://github.com/grafana/plugin-tools/pull/871) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.9.2 (Fri May 03 2024)

#### 🐛 Bug Fix

- Create-plugin: Refactor getTemplateData to be used in generate command and update commands [#837](https://github.com/grafana/plugin-tools/pull/837) ([@oshirohugo](https://github.com/oshirohugo) [@Ukochka](https://github.com/Ukochka) [@leventebalogh](https://github.com/leventebalogh) [@josmperez](https://github.com/josmperez) [@sunker](https://github.com/sunker) [@grafanabot](https://github.com/grafanabot) [@jackw](https://github.com/jackw))

#### Authors: 7

- Erik Sundell ([@sunker](https://github.com/sunker))
- Grot (@grafanabot) ([@grafanabot](https://github.com/grafanabot))
- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Joseph Perez ([@josmperez](https://github.com/josmperez))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v4.9.0 (Thu Apr 25 2024)

#### 🚀 Enhancement

- Create plugin: update scaffolded tests when creating an app plugin [#892](https://github.com/grafana/plugin-tools/pull/892) ([@mckn](https://github.com/mckn))

#### Authors: 1

- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v4.8.0 (Wed Apr 24 2024)

#### 🚀 Enhancement

- Create Plugins: Use non dev docker image on e2e [#883](https://github.com/grafana/plugin-tools/pull/883) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.7.0 (Thu Apr 18 2024)

#### 🚀 Enhancement

- Create Plugin: Run e2e tests against multiple Grafana versions in CI workflow [#870](https://github.com/grafana/plugin-tools/pull/870) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v4.6.2 (Wed Apr 17 2024)

#### 🐛 Bug Fix

- Build: Introduce stricter typechecking [#868](https://github.com/grafana/plugin-tools/pull/868) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v4.6.1 (Fri Apr 05 2024)

#### 🐛 Bug Fix

- Create Plugin: set plugin-e2e to ^1.0.1 [#862](https://github.com/grafana/plugin-tools/pull/862) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v4.6.0 (Fri Apr 05 2024)

#### 🚀 Enhancement

- Create Plugin: Scaffold plugins with playwright for e2e [#847](https://github.com/grafana/plugin-tools/pull/847) ([@jackw](https://github.com/jackw) [@sunker](https://github.com/sunker))

#### Authors: 2

- Erik Sundell ([@sunker](https://github.com/sunker))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v4.5.0 (Fri Apr 05 2024)

#### 🚀 Enhancement

- Create Plugins: Add feature to toggle docker development environment [#857](https://github.com/grafana/plugin-tools/pull/857) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.4.6 (Wed Apr 03 2024)

#### 🐛 Bug Fix

- Plugin E2E: Fix APIs that are broken in older versions of Grafana [#739](https://github.com/grafana/plugin-tools/pull/739) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v4.4.5 (Tue Apr 02 2024)

#### 🐛 Bug Fix

- Create Plugins: Remove unused env variable [#850](https://github.com/grafana/plugin-tools/pull/850) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.4.4 (Thu Mar 28 2024)

#### 🐛 Bug Fix

- Create Plugin: Fix hardcoded path [#846](https://github.com/grafana/plugin-tools/pull/846) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.4.3 (Thu Mar 28 2024)

#### 🐛 Bug Fix

- Create Plugin: Update default yarn version to 1.22.22 [#839](https://github.com/grafana/plugin-tools/pull/839) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v4.4.2 (Thu Mar 28 2024)

#### 🐛 Bug Fix

- Create Plugin: Fix grafana running without plugin backend [#844](https://github.com/grafana/plugin-tools/pull/844) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.4.1 (Wed Mar 27 2024)

#### 🐛 Bug Fix

- Create-Plugin: Improve commands intructions [#843](https://github.com/grafana/plugin-tools/pull/843) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.4.0 (Tue Mar 26 2024)

#### 🐛 Bug Fix

- Create plugin: Update data source templates [#836](https://github.com/grafana/plugin-tools/pull/836) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v4.3.0 (Fri Mar 22 2024)

#### 🚀 Enhancement

- Create Plugin: add support for remote debugging in docker dev env [#809](https://github.com/grafana/plugin-tools/pull/809) ([@oshirohugo](https://github.com/oshirohugo))

#### 🐛 Bug Fix

- Add condition about backend to success message [#830](https://github.com/grafana/plugin-tools/pull/830) ([@Ukochka](https://github.com/Ukochka))

#### Authors: 2

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))
- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v4.2.5 (Mon Mar 18 2024)

#### 🐛 Bug Fix

- Create Plugin: Remove devOnly parameter and related test cases [#823](https://github.com/grafana/plugin-tools/pull/823) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.2.4 (Fri Mar 15 2024)

#### 🐛 Bug Fix

- Create Plugin: upgrade @grafana/eslint-config to 7.0.0 [#822](https://github.com/grafana/plugin-tools/pull/822) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v4.2.3 (Thu Mar 14 2024)

#### 🐛 Bug Fix

- fix: respect package manager in update next steps [#819](https://github.com/grafana/plugin-tools/pull/819) ([@sympatheticmoose](https://github.com/sympatheticmoose))

#### Authors: 1

- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))

---

# v4.2.1 (Thu Feb 29 2024)

#### 🐛 Bug Fix

- Create Plugin: Bump go version in backend plugin scaffolding [#786](https://github.com/grafana/plugin-tools/pull/786) ([@sunker](https://github.com/sunker))
- Create Plugin: Bump Glob to 10.x.x [#764](https://github.com/grafana/plugin-tools/pull/764) ([@jackw](https://github.com/jackw))
- Create Plugin: Bump find-up to 7.x.x [#765](https://github.com/grafana/plugin-tools/pull/765) ([@jackw](https://github.com/jackw))

#### Authors: 2

- Erik Sundell ([@sunker](https://github.com/sunker))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v4.2.0 (Wed Feb 21 2024)

#### 🐛 Bug Fix

- chore: update permissions [#743](https://github.com/grafana/plugin-tools/pull/743) ([@sympatheticmoose](https://github.com/sympatheticmoose))

#### Authors: 1

- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))

---

# v4.1.0 (Mon Feb 19 2024)

#### 🚀 Enhancement

- create-plugin: update grafana version to `v10.3.3` [#674](https://github.com/grafana/plugin-tools/pull/674) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.0.2 (Mon Feb 19 2024)

#### 🐛 Bug Fix

- Create Plugin: Add tests for config [#754](https://github.com/grafana/plugin-tools/pull/754) ([@jackw](https://github.com/jackw) [@leventebalogh](https://github.com/leventebalogh))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.0.1 (Thu Feb 15 2024)

#### 🐛 Bug Fix

- Create plugin: Fix update command [#746](https://github.com/grafana/plugin-tools/pull/746) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v4.0.0 (Wed Feb 14 2024)

#### 💥 Breaking Change

- Create-plugin: Change how the `update` command works [#707](https://github.com/grafana/plugin-tools/pull/707) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.6.0 (Thu Feb 08 2024)

#### 🚀 Enhancement

- Create Plugin: Run prettier on .config after update [#722](https://github.com/grafana/plugin-tools/pull/722) ([@oshirohugo](https://github.com/oshirohugo))

#### Authors: 1

- Hugo Kiyodi Oshiro ([@oshirohugo](https://github.com/oshirohugo))

---

# v3.5.0 (Fri Feb 02 2024)

#### 🚀 Enhancement

- Create-plugin: Use react-router v6 by default [#710](https://github.com/grafana/plugin-tools/pull/710) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.4.0 (Fri Feb 02 2024)

:tada: This release contains work from a new contributor! :tada:

Thank you, Nicolas Ventura ([@6nv](https://github.com/6nv)), for all your work!

#### 🚀 Enhancement

- Update create-plugin workflow action versions [#711](https://github.com/grafana/plugin-tools/pull/711) ([@6nv](https://github.com/6nv))

#### 🐛 Bug Fix

- Fix broken livereload injection when using Grafana 10.2.3 [#696](https://github.com/grafana/plugin-tools/pull/696) ([@samjewell](https://github.com/samjewell))

#### Authors: 2

- Nicolas Ventura ([@6nv](https://github.com/6nv))
- Sam Jewell ([@samjewell](https://github.com/samjewell))

---

# v3.3.0 (Fri Feb 02 2024)

#### 🚀 Enhancement

- Create-plugin: Check if inside a plugin directory [#706](https://github.com/grafana/plugin-tools/pull/706) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.2.0 (Thu Feb 01 2024)

#### 🚀 Enhancement

- Create-plugin: Check for a clean working tree [#705](https://github.com/grafana/plugin-tools/pull/705) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v3.1.3 (Mon Jan 29 2024)

#### 🐛 Bug Fix

- create-plugin: adds archive option for CI workflow [#682](https://github.com/grafana/plugin-tools/pull/682) ([@briangann](https://github.com/briangann))

#### Authors: 1

- Brian Gann ([@briangann](https://github.com/briangann))

---

# v3.1.2 (Thu Jan 25 2024)

#### 🐛 Bug Fix

- Build: Migrate plugin-e2e to Vitest and use tsconfigs/base configs [#694](https://github.com/grafana/plugin-tools/pull/694) ([@jackw](https://github.com/jackw) [@sunker](https://github.com/sunker))

#### Authors: 2

- Erik Sundell ([@sunker](https://github.com/sunker))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v3.1.1 (Fri Jan 19 2024)

#### 🐛 Bug Fix

- Create Plugin: Update outdated plop related packages to latest [#652](https://github.com/grafana/plugin-tools/pull/652) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v3.1.0 (Tue Jan 16 2024)

#### 🚀 Enhancement

- Use `custom.ini` file provided to configure Grafana docker container [#660](https://github.com/grafana/plugin-tools/pull/660) ([@samjewell](https://github.com/samjewell))

#### Authors: 1

- Sam Jewell ([@samjewell](https://github.com/samjewell))

---

# v3.0.0 (Fri Jan 12 2024)

#### 💥 Breaking Change

- Build: Migrate create-plugin to ESM [#658](https://github.com/grafana/plugin-tools/pull/658) ([@jackw](https://github.com/jackw))

#### 🐛 Bug Fix

- Chore: Fixed liniting issues in template [#657](https://github.com/grafana/plugin-tools/pull/657) ([@mckn](https://github.com/mckn))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v2.11.2 (Wed Jan 10 2024)

#### 🐛 Bug Fix

- Fix eslint not generating in plugin migrations [#624](https://github.com/grafana/plugin-tools/pull/624) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v2.11.1 (Wed Jan 10 2024)

#### 🐛 Bug Fix

- Only run ts checker and eslint plugins in webpack dev mode [#647](https://github.com/grafana/plugin-tools/pull/647) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v2.11.0 (Tue Jan 09 2024)

#### 🚀 Enhancement

- Create Plugin: Remove Plop [#602](https://github.com/grafana/plugin-tools/pull/602) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v2.10.2 (Fri Jan 05 2024)

#### 🐛 Bug Fix

- Github workflows: Add correct permissions to the release workflow [#642](https://github.com/grafana/plugin-tools/pull/642) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v2.10.1 (Thu Dec 14 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Carson ([@mure](https://github.com/mure)), for all your work!

#### 🐛 Bug Fix

- Copy over `query_help.md` when building plugins [#374](https://github.com/grafana/plugin-tools/pull/374) ([@mure](https://github.com/mure) [@jackw](https://github.com/jackw))
- Minor edits to style of README.md [#583](https://github.com/grafana/plugin-tools/pull/583) ([@josmperez](https://github.com/josmperez))

#### Authors: 3

- Carson ([@mure](https://github.com/mure))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Joseph Perez ([@josmperez](https://github.com/josmperez))

---

# v2.10.0 (Tue Dec 12 2023)

#### 🚀 Enhancement

- Update react to 18 in package.json template [#455](https://github.com/grafana/plugin-tools/pull/455) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v2.9.0 (Fri Dec 08 2023)

#### 🚀 Enhancement

- Update the scenes-app template to use the latest scenes library and fix some template code style errors [#573](https://github.com/grafana/plugin-tools/pull/573) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v2.8.1 (Fri Dec 08 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Ludovic Muller ([@ludovicm67](https://github.com/ludovicm67)), for all your work!

#### 🐛 Bug Fix

- Templates: import DataQuery from `@grafana/schema` instead of `@grafana/data` [#549](https://github.com/grafana/plugin-tools/pull/549) ([@ludovicm67](https://github.com/ludovicm67))

#### Authors: 1

- Ludovic Muller ([@ludovicm67](https://github.com/ludovicm67))

---

# v2.8.0 (Thu Dec 07 2023)

#### 🚀 Enhancement

- create-plugin: Add provisioning scaffold [#529](https://github.com/grafana/plugin-tools/pull/529) ([@Ukochka](https://github.com/Ukochka) [@josmperez](https://github.com/josmperez) [@sympatheticmoose](https://github.com/sympatheticmoose) [@jackw](https://github.com/jackw) [@sunker](https://github.com/sunker) [@dependabot[bot]](https://github.com/dependabot[bot]) [@tolzhabayev](https://github.com/tolzhabayev) [@leventebalogh](https://github.com/leventebalogh) [@sd2k](https://github.com/sd2k))

#### Authors: 9

- [@dependabot[bot]](https://github.com/dependabot[bot])
- Ben Sully ([@sd2k](https://github.com/sd2k))
- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))
- Erik Sundell ([@sunker](https://github.com/sunker))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Joseph Perez ([@josmperez](https://github.com/josmperez))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))
- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v2.7.0 (Mon Dec 04 2023)

#### 🚀 Enhancement

- Update github release workflow to use our action instead of custom code [#544](https://github.com/grafana/plugin-tools/pull/544) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v2.6.0 (Tue Nov 07 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Joan López de la Franca Beltran ([@joanlopez](https://github.com/joanlopez)), for all your work!

#### 🚀 Enhancement

- update to use sha1sum and minor workflow updates [#503](https://github.com/grafana/plugin-tools/pull/503) ([@briangann](https://github.com/briangann))

#### 🐛 Bug Fix

- Create Plugin: Replace 'master' with 'main' on ref [#507](https://github.com/grafana/plugin-tools/pull/507) ([@joanlopez](https://github.com/joanlopez))

#### Authors: 2

- Brian Gann ([@briangann](https://github.com/briangann))
- Joan López de la Franca Beltran ([@joanlopez](https://github.com/joanlopez))

---

# v2.5.1 (Thu Nov 02 2023)

#### 🐛 Bug Fix

- Create Plugin: Fix app backend test [#518](https://github.com/grafana/plugin-tools/pull/518) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v2.5.0 (Thu Nov 02 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Chris Bedwell ([@ckbedwell](https://github.com/ckbedwell)), for all your work!

#### 🚀 Enhancement

- Adding support for controling the create-plugin tool via a rc file [#506](https://github.com/grafana/plugin-tools/pull/506) ([@mckn](https://github.com/mckn))

#### 🐛 Bug Fix

- Bump nvmrc to 20 to align with package.json [#498](https://github.com/grafana/plugin-tools/pull/498) ([@ckbedwell](https://github.com/ckbedwell))

#### Authors: 2

- Chris Bedwell ([@ckbedwell](https://github.com/ckbedwell))
- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v2.4.0 (Wed Oct 25 2023)

#### 🚀 Enhancement

- Create Plugin: Lint Deprecation Warnings [#268](https://github.com/grafana/plugin-tools/pull/268) ([@jackw](https://github.com/jackw) [@leventebalogh](https://github.com/leventebalogh))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v2.3.0 (Tue Oct 24 2023)

#### 🚀 Enhancement

- Bump to node 20 [#478](https://github.com/grafana/plugin-tools/pull/478) ([@tolzhabayev](https://github.com/tolzhabayev))

#### 🐛 Bug Fix

- Create Plugin: Fix wrongly named files when upgrading/migrating [#490](https://github.com/grafana/plugin-tools/pull/490) ([@jackw](https://github.com/jackw))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# v2.2.2 (Mon Oct 23 2023)

#### 🐛 Bug Fix

- Create Plugin: Fix migrate and update commands [#487](https://github.com/grafana/plugin-tools/pull/487) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v2.2.1 (Fri Oct 20 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Domas ([@domasx2](https://github.com/domasx2)), for all your work!

#### 🐛 Bug Fix

- Templates/Webpack: Include full path in dev mode image output filename [#388](https://github.com/grafana/plugin-tools/pull/388) ([@domasx2](https://github.com/domasx2))
- Docs: Fix broken links in package files [#476](https://github.com/grafana/plugin-tools/pull/476) ([@josmperez](https://github.com/josmperez))

#### Authors: 2

- Domas ([@domasx2](https://github.com/domasx2))
- Joseph Perez ([@josmperez](https://github.com/josmperez))

---

# v2.2.0 (Tue Oct 17 2023)

#### 🚀 Enhancement

- Create Plugin: Make sure scaffolded code is prettified [#461](https://github.com/grafana/plugin-tools/pull/461) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v2.1.2 (Mon Oct 16 2023)

#### 🐛 Bug Fix

- Create Plugin: Prevent conflicting webpack runtimes [#464](https://github.com/grafana/plugin-tools/pull/464) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v2.1.1 (Fri Oct 13 2023)

#### 🐛 Bug Fix

- Create Plugin: Format code under templates/common [#451](https://github.com/grafana/plugin-tools/pull/451) ([@zoltanbedi](https://github.com/zoltanbedi))

#### Authors: 1

- Zoltán Bedi ([@zoltanbedi](https://github.com/zoltanbedi))

---

# v2.1.0 (Fri Oct 13 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Zoltán Bedi ([@zoltanbedi](https://github.com/zoltanbedi)), for all your work!

#### 🚀 Enhancement

- Update only dev dependencies when the update command runs [#458](https://github.com/grafana/plugin-tools/pull/458) ([@academo](https://github.com/academo))

#### 🐛 Bug Fix

- Revert prettier formatting [#450](https://github.com/grafana/plugin-tools/pull/450) ([@zoltanbedi](https://github.com/zoltanbedi))
- Chore: Run prettier [#449](https://github.com/grafana/plugin-tools/pull/449) ([@zoltanbedi](https://github.com/zoltanbedi))

#### Authors: 2

- Esteban Beltran ([@academo](https://github.com/academo))
- Zoltán Bedi ([@zoltanbedi](https://github.com/zoltanbedi))

---

# v2.0.2 (Wed Oct 04 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, null[@mikkancso](https://github.com/mikkancso), for all your work!

#### 🐛 Bug Fix

- Create-plugin: Make baseURL absolute and bump swc/core [#424](https://github.com/grafana/plugin-tools/pull/424) ([@mikkancso](https://github.com/mikkancso))

#### Authors: 1

- [@mikkancso](https://github.com/mikkancso)

---

# v2.0.1 (Tue Oct 03 2023)

#### 🐛 Bug Fix

- Add fixes for backend sdk v0.177.0 [#437](https://github.com/grafana/plugin-tools/pull/437) ([@wbrowne](https://github.com/wbrowne))

#### Authors: 1

- Will Browne ([@wbrowne](https://github.com/wbrowne))

---

# v2.0.0 (Mon Oct 02 2023)

#### 🐛 Bug Fix

- Bugfix: Enable plugins to lazy load modules [#427](https://github.com/grafana/plugin-tools/pull/427) ([@mckn](https://github.com/mckn))
- webpack template: minor lint fixes [#414](https://github.com/grafana/plugin-tools/pull/414) ([@briangann](https://github.com/briangann))
- Increase required node engine to v18 [#405](https://github.com/grafana/plugin-tools/pull/405) ([@academo](https://github.com/academo))
- README typo fixes [#387](https://github.com/grafana/plugin-tools/pull/387) ([@aangelisc](https://github.com/aangelisc))

#### Authors: 4

- Andreas Christou ([@aangelisc](https://github.com/aangelisc))
- Brian Gann ([@briangann](https://github.com/briangann))
- Esteban Beltran ([@academo](https://github.com/academo))
- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v1.12.2 (Thu Sep 07 2023)

#### 🐛 Bug Fix

- fix: update dockerfile with platform [#383](https://github.com/grafana/plugin-tools/pull/383) ([@sympatheticmoose](https://github.com/sympatheticmoose))
- chore: update links to developer portal [#382](https://github.com/grafana/plugin-tools/pull/382) ([@sympatheticmoose](https://github.com/sympatheticmoose))
- Create plugin: Use latest Grafana version [#309](https://github.com/grafana/plugin-tools/pull/309) ([@dprokop](https://github.com/dprokop) [@academo](https://github.com/academo))

#### Authors: 3

- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.12.1 (Fri Aug 25 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Andreas Christou ([@aangelisc](https://github.com/aangelisc)), for all your work!

#### 🐛 Bug Fix

- Update transform regex to detect nested modules [#375](https://github.com/grafana/plugin-tools/pull/375) ([@aangelisc](https://github.com/aangelisc))

#### Authors: 1

- Andreas Christou ([@aangelisc](https://github.com/aangelisc))

---

# v1.12.0 (Fri Aug 18 2023)

#### 🚀 Enhancement

- create-plugin: Add link to documentation about troubleshooting create-plugin on windows [#365](https://github.com/grafana/plugin-tools/pull/365) ([@Ukochka](https://github.com/Ukochka))

#### Authors: 1

- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v1.11.0 (Wed Aug 16 2023)

#### 🚀 Enhancement

- create-plugin: Enable webpack watchOption -> poll if WSL is detected [#356](https://github.com/grafana/plugin-tools/pull/356) ([@Ukochka](https://github.com/Ukochka))

#### Authors: 1

- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v1.10.1 (Mon Aug 14 2023)

#### 🐛 Bug Fix

- Fix swc-core version to 1.3.75 to prevent existing bug with baseUrls [#346](https://github.com/grafana/plugin-tools/pull/346) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.10.0 (Mon Aug 07 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka)), for all your work!

#### 🚀 Enhancement

- sign-plugin: GRAFANA_ACESS_POLICY_TOKEN has been added instead of GRAFANA_API_KEY [#331](https://github.com/grafana/plugin-tools/pull/331) ([@Ukochka](https://github.com/Ukochka))

#### Authors: 1

- Yulia Shanyrova ([@Ukochka](https://github.com/Ukochka))

---

# v1.9.1 (Wed Aug 02 2023)

#### 🐛 Bug Fix

- Do not remove go_plugin_build_manifest on frontendbuild [#322](https://github.com/grafana/plugin-tools/pull/322) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.9.0 (Tue Jul 11 2023)

#### 🚀 Enhancement

- Do not generate videos for cypress e2e tests [#302](https://github.com/grafana/plugin-tools/pull/302) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.8.0 (Tue Jul 11 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Dominik Prokop ([@dprokop](https://github.com/dprokop)), for all your work!

#### 🚀 Enhancement

- Create Plugin: add readme best practice example [#298](https://github.com/grafana/plugin-tools/pull/298) ([@sympatheticmoose](https://github.com/sympatheticmoose))

#### 🐛 Bug Fix

- Create Plugin: Update scenes to latest version [#287](https://github.com/grafana/plugin-tools/pull/287) ([@dprokop](https://github.com/dprokop))

#### Authors: 2

- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))
- Dominik Prokop ([@dprokop](https://github.com/dprokop))

---

# v1.7.0 (Wed Jul 05 2023)

#### 🚀 Enhancement

- Making grafana-image parameter flexible [#286](https://github.com/grafana/plugin-tools/pull/286) ([@tolzhabayev](https://github.com/tolzhabayev))

#### 🐛 Bug Fix

- Create Plugin: Add rxjs and schema to known Jest ES modules [#289](https://github.com/grafana/plugin-tools/pull/289) ([@jackw](https://github.com/jackw))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# v1.6.3 (Mon Jun 12 2023)

#### 🐛 Bug Fix

- Create Plugin: Bump dependencies [#279](https://github.com/grafana/plugin-tools/pull/279) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v1.6.2 (Wed Jun 07 2023)

### Release Notes

#### Create Plugin: Introduce OS check ([#263](https://github.com/grafana/plugin-tools/pull/263))

`create-plugin` will now exit when run natively on Windows, which is an unsupported platform with known issues. By exiting early we hope to prevent users from hitting issues whilst developing plugins. We recommend the use of Windows Subsystem for Linux (WSL) which is supported.

---

#### 🐛 Bug Fix

- Create Plugin: Introduce OS check [#263](https://github.com/grafana/plugin-tools/pull/263) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v1.6.1 (Tue Jun 06 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Ben Sully ([@sd2k](https://github.com/sd2k)), for all your work!

#### 🐛 Bug Fix

- Create Plugin: fix 'Install dependencies' command in generated frontend README [#276](https://github.com/grafana/plugin-tools/pull/276) ([@sd2k](https://github.com/sd2k))

#### Authors: 1

- Ben Sully ([@sd2k](https://github.com/sd2k))

---

# v1.6.0 (Tue Jun 06 2023)

#### 🚀 Enhancement

- Create Plugin: Enable apps by default [#274](https://github.com/grafana/plugin-tools/pull/274) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v1.5.2 (Thu Jun 01 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Alex Simonok ([@asimonok](https://github.com/asimonok)), for all your work!

#### 🐛 Bug Fix

- Create Plugin: Fix Code Coverage for JSX files [#271](https://github.com/grafana/plugin-tools/pull/271) ([@asimonok](https://github.com/asimonok))

#### Authors: 1

- Alex Simonok ([@asimonok](https://github.com/asimonok))

---

# v1.5.1 (Wed May 31 2023)

#### 🐛 Bug Fix

- Create Plugin: Fix lint:fix not passing args with NPM [#265](https://github.com/grafana/plugin-tools/pull/265) ([@jackw](https://github.com/jackw))
- Scripts: Add error-handling to generator scripts [#257](https://github.com/grafana/plugin-tools/pull/257) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v1.5.0 (Wed May 24 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Dominik Prokop ([@dprokop](https://github.com/dprokop)), for all your work!

#### 🚀 Enhancement

- Create Plugin: Add scenes app scaffolding [#250](https://github.com/grafana/plugin-tools/pull/250) ([@dprokop](https://github.com/dprokop) [@jackw](https://github.com/jackw))

#### Authors: 2

- Dominik Prokop ([@dprokop](https://github.com/dprokop))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v1.4.0 (Tue May 23 2023)

#### 🚀 Enhancement

- Create Plugin: App plugins with Top Nav support [#246](https://github.com/grafana/plugin-tools/pull/246) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v1.3.3 (Fri May 19 2023)

#### 🐛 Bug Fix

- create-plugin: updates for ci workflow [#242](https://github.com/grafana/plugin-tools/pull/242) ([@briangann](https://github.com/briangann))

#### Authors: 1

- Brian Gann ([@briangann](https://github.com/briangann))

---

# v1.3.2 (Thu May 18 2023)

#### 🐛 Bug Fix

- Chore: Update dev-dependencies [#232](https://github.com/grafana/plugin-tools/pull/232) ([@leventebalogh](https://github.com/leventebalogh) [@jackw](https://github.com/jackw))
- Fix fonts not loaded correctly on generated bundles [#251](https://github.com/grafana/plugin-tools/pull/251) ([@academo](https://github.com/academo))

#### 📝 Documentation

- Create Plugin: Update readme for supported package managers [#244](https://github.com/grafana/plugin-tools/pull/244) ([@jackw](https://github.com/jackw))

#### Authors: 3

- Esteban Beltran ([@academo](https://github.com/academo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v1.3.1 (Mon May 15 2023)

#### 🐛 Bug Fix

- Create Plugin: Fix react types errors [#238](https://github.com/grafana/plugin-tools/pull/238) ([@jackw](https://github.com/jackw))
- chore: update grafanaDependency for datasources [#247](https://github.com/grafana/plugin-tools/pull/247) ([@sympatheticmoose](https://github.com/sympatheticmoose))

#### 📝 Documentation

- docs: readme update for windows [#240](https://github.com/grafana/plugin-tools/pull/240) ([@sympatheticmoose](https://github.com/sympatheticmoose))

#### Authors: 2

- David Harris ([@sympatheticmoose](https://github.com/sympatheticmoose))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v1.3.0 (Fri Apr 28 2023)

#### 🚀 Enhancement

- Create Plugin: Support different Node package managers [#226](https://github.com/grafana/plugin-tools/pull/226) ([@jackw](https://github.com/jackw))

#### 🐛 Bug Fix

- Documentation: Fix path in for template README.md for jest customizations [#218](https://github.com/grafana/plugin-tools/pull/218) ([@briangann](https://github.com/briangann))

#### 🔩 Dependency Updates

- Chore: Update `glob` to v10 [#230](https://github.com/grafana/plugin-tools/pull/230) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 3

- Brian Gann ([@briangann](https://github.com/briangann))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v1.2.1 (Thu Mar 30 2023)

#### 🐛 Bug Fix

- Create Plugin: Don't upgrade grafana dependencies when running update command [#217](https://github.com/grafana/plugin-tools/pull/217) ([@academo](https://github.com/academo))
- CreatePlugin: Add vscode launch.json files for backend debug mode [#224](https://github.com/grafana/plugin-tools/pull/224) ([@xnyo](https://github.com/xnyo))

#### Authors: 2

- Esteban Beltran ([@academo](https://github.com/academo))
- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))

---

# v1.2.0 (Fri Mar 17 2023)

#### 🚀 Enhancement

- Template: Removed the module.test.ts file from being scafollded by create-plugin [#225](https://github.com/grafana/plugin-tools/pull/225) ([@mckn](https://github.com/mckn))

#### Authors: 1

- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v1.1.3 (Mon Mar 13 2023)

#### 🐛 Bug Fix

- Run go mod tidy after generating with backend [#216](https://github.com/grafana/plugin-tools/pull/216) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.1.2 (Fri Mar 10 2023)

#### 🐛 Bug Fix

- Chore: Remove unused deps from scaffolded plugins [#221](https://github.com/grafana/plugin-tools/pull/221) ([@leventebalogh](https://github.com/leventebalogh))

#### Authors: 1

- Levente Balogh ([@leventebalogh](https://github.com/leventebalogh))

---

# v1.1.1 (Tue Mar 07 2023)

#### 🐛 Bug Fix

- Keep custom executable name if defined [#207](https://github.com/grafana/plugin-tools/pull/207) ([@academo](https://github.com/academo))

#### Authors: 1

- Esteban Beltran ([@academo](https://github.com/academo))

---

# v1.1.0 (Mon Mar 06 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Romain Gaillard ([@romain-gaillard](https://github.com/romain-gaillard)), for all your work!

#### 🚀 Enhancement

- Auto update grafana go sdk after generation [#214](https://github.com/grafana/plugin-tools/pull/214) ([@academo](https://github.com/academo))

#### 🐛 Bug Fix

- Bumped mage action to v2 to avoid the warning "Node.js 12 actions are… [#213](https://github.com/grafana/plugin-tools/pull/213) ([@romain-gaillard](https://github.com/romain-gaillard))
- Fix datasource without backend template and update test CI [#206](https://github.com/grafana/plugin-tools/pull/206) ([@academo](https://github.com/academo))
- Minor typo fixed and improved comment consistency in frontend-getting-started.md [#211](https://github.com/grafana/plugin-tools/pull/211) ([@romain-gaillard](https://github.com/romain-gaillard))

#### Authors: 2

- Esteban Beltran ([@academo](https://github.com/academo))
- Romain Gaillard ([@romain-gaillard](https://github.com/romain-gaillard))

---

# v1.0.1 (Fri Mar 03 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Will Browne ([@wbrowne](https://github.com/wbrowne)), for all your work!

#### 🐛 Bug Fix

- Add `@latest` to docs and scripts using npx commands [#208](https://github.com/grafana/plugin-tools/pull/208) ([@tolzhabayev](https://github.com/tolzhabayev))
- Remove default logging examples as their usage is prone to user error [#205](https://github.com/grafana/plugin-tools/pull/205) ([@wbrowne](https://github.com/wbrowne))

#### Authors: 2

- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))
- Will Browne ([@wbrowne](https://github.com/wbrowne))

---

# v1.0.0 (Fri Feb 03 2023)

#### 💥 Breaking Change

- Introduce version commands [#193](https://github.com/grafana/plugin-tools/pull/193) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.11.0 (Fri Feb 03 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Isabella Siu ([@iwysiu](https://github.com/iwysiu)), for all your work!

#### 🚀 Enhancement

- Update datasource plugin template [#172](https://github.com/grafana/plugin-tools/pull/172) ([@iwysiu](https://github.com/iwysiu) [@jackw](https://github.com/jackw))

#### Authors: 2

- Isabella Siu ([@iwysiu](https://github.com/iwysiu))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.10.0 (Thu Feb 02 2023)

#### 🚀 Enhancement

- CreatePlugin: Change default docker image to grafana-enterprise [#197](https://github.com/grafana/plugin-tools/pull/197) ([@mckn](https://github.com/mckn))

#### Authors: 1

- Marcus Andersson ([@mckn](https://github.com/mckn))

---

# v0.9.1 (Thu Feb 02 2023)

#### 🐛 Bug Fix

- Create Plugin: Fix deeply nested plugins [#195](https://github.com/grafana/plugin-tools/pull/195) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.9.0 (Thu Jan 26 2023)

#### 🚀 Enhancement

- Create Plugin: Update jest config to support Grafana 9.4 packages [#188](https://github.com/grafana/plugin-tools/pull/188) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.8.4 (Fri Jan 13 2023)

#### 🐛 Bug Fix

- Create Plugin: Make sure nested plugins dist directory structure is correct [#182](https://github.com/grafana/plugin-tools/pull/182) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.8.3 (Thu Jan 12 2023)

#### 🐛 Bug Fix

- Create Plugin: Update yarn scripts and instructions to work post scaffold [#168](https://github.com/grafana/plugin-tools/pull/168) ([@sarahzinger](https://github.com/sarahzinger) [@jackw](https://github.com/jackw))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Sarah Zinger ([@sarahzinger](https://github.com/sarahzinger))

---

# v0.8.2 (Wed Jan 11 2023)

:tada: This release contains work from a new contributor! :tada:

Thank you, Sarah Zinger ([@sarahzinger](https://github.com/sarahzinger)), for all your work!

#### 🐛 Bug Fix

- Create Plugin: Update docs to build backend before running docker [#167](https://github.com/grafana/plugin-tools/pull/167) ([@sarahzinger](https://github.com/sarahzinger))

#### Authors: 1

- Sarah Zinger ([@sarahzinger](https://github.com/sarahzinger))

---

# v0.8.1 (Tue Dec 13 2022)

:tada: This release contains work from a new contributor! :tada:

Thank you, Erik Sundell ([@sunker](https://github.com/sunker)), for all your work!

#### 🐛 Bug Fix

- Templates: Use getDefaultQuery method to set query default values [#173](https://github.com/grafana/plugin-tools/pull/173) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

# v0.8.0 (Wed Nov 30 2022)

#### 🚀 Enhancement

- Create Plugin: Update Jest to v29 [#164](https://github.com/grafana/plugin-tools/pull/164) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.7.1 (Tue Nov 29 2022)

#### 🐛 Bug Fix

- Create Plugin: Remove links pointing to deprecated starter templates [#162](https://github.com/grafana/plugin-tools/pull/162) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.7.0 (Tue Nov 29 2022)

#### 🚀 Enhancement

- Create plugin: Introduce sign-plugin [#160](https://github.com/grafana/plugin-tools/pull/160) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.6.3 (Mon Nov 28 2022)

#### 🐛 Bug Fix

- Create Plugin: Fix incorrect templates being used for scaffolding [#158](https://github.com/grafana/plugin-tools/pull/158) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.6.2 (Thu Nov 24 2022)

#### 🐛 Bug Fix

- Create Plugin: Fix Plugin ID in backend to match plugin.json [#159](https://github.com/grafana/plugin-tools/pull/159) ([@jackw](https://github.com/jackw))
- Create-Plugin: Add errors with status code in backend template [#153](https://github.com/grafana/plugin-tools/pull/153) ([@xnyo](https://github.com/xnyo))

#### 📝 Documentation

- Docs - make sure that angular is not supported [#155](https://github.com/grafana/plugin-tools/pull/155) ([@tolzhabayev](https://github.com/tolzhabayev))

#### Authors: 3

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# v0.6.1 (Fri Nov 18 2022)

#### 🐛 Bug Fix

- Create-Plugin: Update grafanaVersion to 9.2.5 [#149](https://github.com/grafana/plugin-tools/pull/149) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.6.0 (Fri Nov 18 2022)

#### 🚀 Enhancement

- Create-Plugin: Add backend template for app plugins [#138](https://github.com/grafana/plugin-tools/pull/138) ([@xnyo](https://github.com/xnyo))

#### Authors: 1

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))

---

# v0.5.4 (Fri Nov 18 2022)

#### 🐛 Bug Fix

- Create-plugin: Fix failing jest config [#151](https://github.com/grafana/plugin-tools/pull/151) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.5.3 (Thu Nov 17 2022)

#### 🐛 Bug Fix

- Create-Plugin: Transform known ES modules in jest config [#145](https://github.com/grafana/plugin-tools/pull/145) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.5.2 (Thu Nov 17 2022)

#### 🐛 Bug Fix

- Create-Plugin: Bump dependencies to support node 18 [#144](https://github.com/grafana/plugin-tools/pull/144) ([@jackw](https://github.com/jackw))
- Create-Plugin: Backend template: Switch from Info to Debug level [#146](https://github.com/grafana/plugin-tools/pull/146) ([@xnyo](https://github.com/xnyo))

#### Authors: 2

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.5.1 (Mon Nov 14 2022)

#### 🐛 Bug Fix

- Fix: include uppercase characters when normalising plugin id [#142](https://github.com/grafana/plugin-tools/pull/142) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# v0.5.0 (Mon Nov 07 2022)

:tada: This release contains work from a new contributor! :tada:

Thank you, Giuseppe Guerra ([@xnyo](https://github.com/xnyo)), for all your work!

#### 🚀 Enhancement

- Create-Plugin: Implement DataSourceWithBackend for datasource plugins with backend [#134](https://github.com/grafana/plugin-tools/pull/134) ([@xnyo](https://github.com/xnyo))

#### 🐛 Bug Fix

- Use pluginId to generate the docker-compose.yml file [#128](https://github.com/grafana/plugin-tools/pull/128) ([@academo](https://github.com/academo))

#### Authors: 2

- Esteban Beltran ([@academo](https://github.com/academo))
- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))

---

# v0.4.1 (Mon Oct 31 2022)

#### 🐛 Bug Fix

- CI: Introduce auto for publishing packages [#127](https://github.com/grafana/plugin-tools/pull/127) ([@jackw](https://github.com/jackw))
- Manually rename gitignore to prevent yarn and npm pack from removing them [#126](https://github.com/grafana/plugin-tools/pull/126) ([@academo](https://github.com/academo))
- Removing ts-ignore [#124](https://github.com/grafana/plugin-tools/pull/124) ([@tolzhabayev](https://github.com/tolzhabayev))

#### Authors: 3

- Esteban Beltran ([@academo](https://github.com/academo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))
