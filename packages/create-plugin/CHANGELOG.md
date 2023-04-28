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
