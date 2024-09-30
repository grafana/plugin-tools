---
id: publishing-best-practices
title: Publishing best practices
sidebar_position: 5
description: Best practices for publishing your plugin
keywords:
  - grafana
  - plugins
  - plugin
  - publish
  - best practices
---

# Publishing best practices

When publishing a Grafana plugin, adhering to best practices ensures not only a smooth submission and review process but also a higher quality experience for users. By following established guidelines, you improve the plugin’s performance, security, and discoverability within the Grafana ecosystem, ensuring that your plugin stands out as a shining example of what a Grafana plugin can be.

This document outlines essential best practices for developers to follow before publishing their Grafana plugins. These recommendations will help you avoid common pitfalls, streamline the review process, and create a plugin that integrates seamlessly into users' workflows while maintaining the high standards expected in the Grafana ecosystem. Whether you’re fine-tuning your plugin’s functionality or preparing your documentation, following these practices will ensure that your plugin is optimized for success from the start.

## Populating your plugin's metadata

Metadata plays a crucial role in making your Grafana plugin discoverable and user-friendly. Properly structuring the [metadata in your `plugin.json` file](../reference/metadata.md) not only helps users find your plugin in [Grafana’s plugin catalog](https://grafana.com/grafana/plugins/) but also provides essential details about the plugin’s functionality and compatibility. Here’s a breakdown of the key components to focus on:

**Plugin name (`name`)**

The name of your plugin should be clear, concise, and descriptive. It is the first point of interaction for potential users, so avoid overly generic or cryptic names. Aim for a name that reflects the plugin’s primary functionality, making it easy to understand its purpose at a glance.

**Description (`description`)**

The description field should succinctly summarize what your plugin does and why users should install it. Limit the description to two sentences, highlighting the core functionality and use cases. A well-written description not only informs users but also contributes to better search results in the catalog.

**Keywords (`keywords`)**

Keywords improve the searchability of your plugin within Grafana’s catalog. Choose terms that accurately describe your plugin’s functionality and data types it supports (e.g., "JSON", "SQL", "visualization"). However, avoid keyword stuffing; irrelevant keywords will be flagged during the review process, potentially delaying publication.

**Grafana version compatibility (`grafanaDependency`)**

Ensure your plugin specifies the minimum Grafana version it is compatible with. This guarantees that users running different versions of Grafana know whether your plugin will work for them. Regularly update this field as new versions of Grafana are released, and [run end-to-end tests](../e2e-test-a-plugin/introduction.md) to confirm compatibility with those releases.

**Other Grafana plugin dependencies (`plugins`)**

If your plugin relies on any other published Grafana plugins in order to function correctly, be sure to add them to this array field. Plugins listed as dependencies here will be automatically installed by Grafana when a user installs your plugin.

---

Outline

2. Build a Comprehensive README

   Core Information: Include plugin overview, usage instructions, and system requirements.
   Media Enhancements: Add screenshots or videos to visually guide users through the setup and configuration.
   Dynamic Badges: Use dynamic badges to display plugin versions, download stats, and other critical information.
   Contribution Guidelines: Provide clear information on how users can contribute, report issues, or offer feedback.

3. Optimize Metadata for Discoverability

   plugin.json Essentials: Ensure the plugin has a clear name, concise description, and relevant keywords to improve searchability.
   Keywords: Use relevant keywords like data types (e.g., JSON) to improve discoverability, but avoid keyword stuffing.

4. Ensure Compatibility Across Grafana Versions

   Specify grafanaDependency: Declare the minimum supported Grafana version in your plugin.json.
   End-to-End Testing: Leverage tools like plugin-e2e to ensure your plugin works seamlessly across different Grafana releases.

5. Provide a Provisioned Test Environment

   Streamlined Testing: Set up a provisioned environment in Docker for Grafana, including sample dashboards. This speeds up the review process and enables contributors to test the plugin easily.
   Improved Collaboration: A provisioned environment allows community members to contribute with more clarity and confidence.

6. Validate the Plugin

   Use the Validator Tool: Run Grafana’s plugin validator tool locally or in CI to catch any security or structural issues before submission.
   Automated CI Workflows: Use GitHub Actions to automate plugin validation during development.

7. Automate Releases with GitHub Actions

   Continuous Integration: Use GitHub Actions to automate testing and validation on every commit.
   Release Workflow: Implement GitHub's release workflows to automate building, signing, and packaging the plugin for submission.

8. Conclusion

   Recap: Reiterate the importance of following these steps to ensure a smooth plugin review process and enhance user experience.
   Additional Resources: Provide links to relevant developer tools and documentation for further reading
