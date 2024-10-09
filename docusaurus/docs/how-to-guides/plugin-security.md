---
id: plugin-security
title: Plugin security
description: A guide for secure plugin development.
keywords:
  - grafana
  - plugins
  - security
  - safety
  - privacy
  - plugin security
---

# Secure plugin development

Building secure plugins for Grafana is essential to protecting user data, maintaining trust, and avoiding vulnerabilities that could compromise your Grafana plugin. This guide covers best practices for secure plugin development across the backend and frontend.

## General best practices

### Security audits and reviews

Before submitting a plugin for publication, conduct security audits and reviews. Use tools like `gosec` for Go and `eslint` for TypeScript to catch common issues. Peer reviews should focus on identifying injection vulnerabilities, improper handling of sensitive data, and weak authentication.

### Minimizing dependencies

Keep dependencies to a minimum. Update packages regularly and remove unused ones. Use tools like `npm audit` and `go mod tidy` to identify outdated or vulnerable dependencies.

### Secure coding practices

- **Don’t hardcode secrets**: Avoid hardcoding API keys, tokens, or passwords in your code.
- **Use least privilege**: Ensure your plugin uses the least privileged account or role when accessing resources.

### Data handling

- **Prevent data exposure**: Don’t expose sensitive data like user credentials, API tokens, or personally identifiable information (PII) through logs, requests, or the browser console.
- **Encrypt data**: Always encrypt sensitive data in transit using SSL/TLS, and encrypt at rest when needed.

## Backend security best practices

### Handling external requests

If your plugin communicates with external services:

- **Use HTTPS**: Ensure all external requests use HTTPS.
- **Set timeouts**: Set timeouts for external requests to prevent them from hanging indefinitely.
- **Implement retry logic**: Use retry logic with exponential backoff for external requests.

### Authentication and authorization

Ensure [secure authentication methods](../how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins.md) are in place for API interactions. Always verify that the user accessing your plugin has the appropriate permissions.

- **Authorization checks**: Confirm that users have the required roles before allowing access to certain actions within the plugin.

### Prevent injection vulnerabilities

- **SQL injection**: Use prepared statements and parameterized queries to prevent SQL injection attacks.
- **Command injection**: Ensure user inputs are sanitized before passing them to the system shell or executing commands.

### Error handling and logging

- **Avoid leaking sensitive data**: Don’t log sensitive information like passwords or tokens.
- **Log responsibly**: Ensure logging doesn’t include stack traces or sensitive information in production environments.

## Frontend security best practices

### API requests

When the frontend communicates with the backend:

- **Use HTTPS**: Always use HTTPS to protect data.
- **Secure tokens**: Store API tokens securely, using cookies with `HttpOnly` and `Secure` flags if possible.

### Sanitizing user inputs

Sanitize and validate all user input on both the client and server side.

- **Sanitize inputs**: Use a library like `DOMPurify` to sanitize inputs before rendering in the DOM.

### Cross-site scripting (XSS) prevention

- **Escape user-provided content**: Always escape or sanitize user-generated content to prevent XSS.

### Avoid exposing sensitive data

- **Secure sensitive data**: Never expose API keys, tokens, or other sensitive data in browser consoles or network requests.

## Handling secrets and configuration

### Storing secrets

Store API keys, tokens, and other secrets securely.

- **Avoid storing secrets in code**: Never store sensitive information directly in your source code.

### Using environment variables

For backend configurations, use environment variables to manage sensitive information.

- **Use `.env` for development**: Store sensitive data in environment variables and make sure `.env` files are in `.gitignore` to prevent committing them to version control.

### Configuration validation

Validate user-provided configuration values to prevent configuration errors that could lead to security vulnerabilities like injection attacks.

## Additional resources

For further reading:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) – The most critical security risks for web applications.
- [GoSec](https://github.com/securego/gosec) – A security analysis tool for Go.
- [npm audit](https://docs.npmjs.com/cli/v6/commands/npm-audit) – Check for vulnerabilities in npm dependencies.
- [React security best practices](https://reactjs.org/docs/security.html) – Official React security guidelines.

Following these best practices will help you build secure Grafana plugins that protect user data and the integrity of the Grafana instance.
