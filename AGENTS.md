# AGENTS.md - Grafana Plugin Tools Guide

This document is the single source of truth for how to work inside this monorepo. It covers commands, architecture, conventions, testing, and codebase-specific guidance so future AI agents and developers can be effective immediately.

## Overview

You are an expert in TypeScript and Node.js development. You are also an expert with common libraries and frameworks used in the industry.

- Always refer to the @CONTRIBUTING.md and any linked markdown files found within it.
- Follow the user's requirements carefully and to the letter.
- Do not make any changes without getting confirmation from the user first.
- First think step-by-step
- Describe your plan for what to build in pseudocode, written out in great detail.

## Tech Stack

The applications in this mono-repo use the following tech stack:

- Nx >=21
- TypeScript >=5.8
- Node.js 24
- Vitest 4
- Rollup
- Playwright

## Commands

### Entire codebase

- Use `npm run build` to run all builds
- Use `npm run test:ci` to run all tests
- Use `npm run lint` to lint all packages
- Use `npm run typecheck` to typecheck all packages

- Use `npm run build -w @<package_scope>/<package_name>` for running individual package builds
- Use `npm run dev -w @<package_scope>/<package_name>` for running builds with watch
- Use `npm run test -w @<package_scope>/<package_name> -- --run` for running individual package tests
- Use `npm run lint -w @<package_scope>/<package_name>` for linting individual packages
- Use `npm run typecheck -w @<package_scope>/<package_name>` for typechecking individual packages

To run commands for multiple packages refer to the `nx` instructions below but always prefix the command with `npx`.

## Response Constraints

- Do not remove any existing code unless necessary.
- Do not remove my comments or commented-out code unless necessary.
- Do not change the formatting of my imports.
- Do not change the formatting of my code unless important for new functionality.

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Prefer named exports.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).

## Dependency Installation

- Always use NPM to install missing packages
- Always install dependencies in the workspace that uses them, e.g. `npm install <package_name> -w <workspace>`
- Any devDependency installation that is used by more than one workspace should be installed in the workspace root package.json

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Use strict typing; never use 'any'
- Avoid enums; use maps instead.
- Write straightforward, readable, and maintainable code
- Follow SOLID principles and design patterns

## Syntax and Formatting

- Use the "function" keyword for pure functions.
- Use curly braces for all conditionals. Favor simplicity over cleverness.
- Classes: PascalCase
- Variables, functions, methods: camelCase
- Files, directories: kebab-case
- Constants, env variables: UPPERCASE

## Testing

- Colocate tests with their implementation as `*.test.ts`.
- Use vitest

## Code Review Checklist

- Ensure proper typing
- Check for code duplication
- Verify error handling
- Confirm test coverage
- Review naming conventions
- Assess overall code structure and readability

## Documentation

- When writing documentation, README's, technical writing, technical documentation, JSDocs or comments, always refer to the Grafana's writers toolkit at https://grafana.com/docs/writers-toolkit/write/style-guide/

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
