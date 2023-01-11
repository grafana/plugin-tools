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
