# (Mon Nov 28 2022)

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.6.3`
  - Create Plugin: Fix incorrect templates being used for scaffolding [#158](https://github.com/grafana/plugin-tools/pull/158) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Thu Nov 24 2022)

#### 🐛 Bug Fix

- CI: Speed up builds [#152](https://github.com/grafana/plugin-tools/pull/152) ([@jackw](https://github.com/jackw))
- `@grafana/create-plugin@0.6.2`
  - Create Plugin: Fix Plugin ID in backend to match plugin.json [#159](https://github.com/grafana/plugin-tools/pull/159) ([@jackw](https://github.com/jackw))
  - Create-Plugin: Add errors with status code in backend template [#153](https://github.com/grafana/plugin-tools/pull/153) ([@xnyo](https://github.com/xnyo))

#### 📝 Documentation

- `@grafana/create-plugin@0.6.2`
  - Docs - make sure that angular is not supported [#155](https://github.com/grafana/plugin-tools/pull/155) ([@tolzhabayev](https://github.com/tolzhabayev))

#### Authors: 3

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# (Fri Nov 18 2022)

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.6.1`
  - Create-Plugin: Update grafanaVersion to 9.2.5 [#149](https://github.com/grafana/plugin-tools/pull/149) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Fri Nov 18 2022)

#### 🚀 Enhancement

- `@grafana/create-plugin@0.6.0`
  - Create-Plugin: Add backend template for app plugins [#138](https://github.com/grafana/plugin-tools/pull/138) ([@xnyo](https://github.com/xnyo))

#### Authors: 1

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))

---

# (Fri Nov 18 2022)

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.5.4`
  - Create-plugin: Fix failing jest config [#151](https://github.com/grafana/plugin-tools/pull/151) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Thu Nov 17 2022)

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.5.3`
  - Create-Plugin: Transform known ES modules in jest config [#145](https://github.com/grafana/plugin-tools/pull/145) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Thu Nov 17 2022)

#### 🐛 Bug Fix

- CI: Silence slack from pinging entire channel [#148](https://github.com/grafana/plugin-tools/pull/148) ([@jackw](https://github.com/jackw))
- `@grafana/create-plugin@0.5.2`
  - Create-Plugin: Bump dependencies to support node 18 [#144](https://github.com/grafana/plugin-tools/pull/144) ([@jackw](https://github.com/jackw))
  - Create-Plugin: Backend template: Switch from Info to Debug level [#146](https://github.com/grafana/plugin-tools/pull/146) ([@xnyo](https://github.com/xnyo))

#### Authors: 2

- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))
- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Mon Nov 14 2022)

#### 🐛 Bug Fix

- Bumping workflow version to use node 16 instead of deprecated node 12 [#143](https://github.com/grafana/plugin-tools/pull/143) ([@tolzhabayev](https://github.com/tolzhabayev))
- `@grafana/create-plugin@0.5.1`
  - Fix: include uppercase characters when normalising plugin id [#142](https://github.com/grafana/plugin-tools/pull/142) ([@jackw](https://github.com/jackw))

#### 🔩 Dependency Updates

- CI: Introduce slack plugin for automating release messages [#137](https://github.com/grafana/plugin-tools/pull/137) ([@jackw](https://github.com/jackw))

#### Authors: 2

- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))

---

# (Mon Nov 07 2022)

#### 🐛 Bug Fix

- `@grafana/sign-plugin@0.0.2`
  - Fix: Prevent error if rootUrls arg is not passed [#136](https://github.com/grafana/plugin-tools/pull/136) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

# (Mon Nov 07 2022)

:tada: This release contains work from a new contributor! :tada:

Thank you, Giuseppe Guerra ([@xnyo](https://github.com/xnyo)), for all your work!

#### 🚀 Enhancement

- `@grafana/create-plugin@0.5.0`
  - Create-Plugin: Implement DataSourceWithBackend for datasource plugins with backend [#134](https://github.com/grafana/plugin-tools/pull/134) ([@xnyo](https://github.com/xnyo))

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.5.0`
  - Use pluginId to generate the docker-compose.yml file [#128](https://github.com/grafana/plugin-tools/pull/128) ([@academo](https://github.com/academo))

#### Authors: 2

- Esteban Beltran ([@academo](https://github.com/academo))
- Giuseppe Guerra ([@xnyo](https://github.com/xnyo))

---

# (Mon Oct 31 2022)

#### 🐛 Bug Fix

- `@grafana/create-plugin@0.4.1`, `@grafana/sign-plugin@0.0.1`
  - CI: Introduce auto for publishing packages [#127](https://github.com/grafana/plugin-tools/pull/127) ([@jackw](https://github.com/jackw))
- `@grafana/create-plugin@0.4.1`
  - Manually rename gitignore to prevent yarn and npm pack from removing them [#126](https://github.com/grafana/plugin-tools/pull/126) ([@academo](https://github.com/academo))
  - Removing ts-ignore [#124](https://github.com/grafana/plugin-tools/pull/124) ([@tolzhabayev](https://github.com/tolzhabayev))

#### Authors: 3

- Esteban Beltran ([@academo](https://github.com/academo))
- Jack Westbrook ([@jackw](https://github.com/jackw))
- Timur Olzhabayev ([@tolzhabayev](https://github.com/tolzhabayev))
