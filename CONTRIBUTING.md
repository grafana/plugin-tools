# Contributing

## How do I... <a name="toc" id="toc"></a>

- [Use This Guide](#introduction)?
- Ask or Say Something? 🤔🐛😱
  - [Request Support](#request-support)
  - [Report an Error or Bug](#report-an-error-or-bug)
  - [Request a Feature](#request-a-feature)
- Make Something? 🤓👩🏽‍💻📜🍳
  - [Project Setup](#project-setup)
  - [Contributor License Agreement (CLA)](#contributor-license-agreement-cla)
  - [Contribute Documentation](#contribute-documentation)
  - [Contribute Code](#contribute-code)
- Manage Something ✅🙆🏼💃👔
  - [Preview Your Changes Before Release](#preview-your-changes-before-release)
  - [Create a Release](#create-a-release)

## Introduction

Thank you so much for your interest in contributing!. All types of contributions are encouraged and valued. See the [table of contents](#toc) for different ways to help and details about how this project handles them!📝

Please make sure to read the relevant section before making your contribution! It will make it a lot easier for us maintainers to make the most of it and smooth out the experience for all involved. 💚

The Project Team looks forward to your contributions. 🙌🏾✨

## Request Support

If you have a question about this project, how to use it, or just need clarification about something:

- Open an Issue at https://github.com/grafana/plugin-tools/issues
- Provide as much context as you can about what you're running into.
- Provide project and platform versions (nodejs, npm, etc), depending on what seems relevant. If not, please be ready to provide that information if maintainers ask for it.

Once it's filed:

- The project team will label the issue.
- Someone will try to have a response soon.
- If you or the maintainers don't respond to an issue for 30 days, the issue will be closed. If you want to come back to it, reply (once, please), and we'll reopen the existing issue. Please avoid filing new issues as extensions of one you already made.

## Report an Error or Bug

If you run into an error or bug with the project:

- Open an Issue at https://github.com/grafana/plugin-tools/issues
- Include _reproduction steps_ that someone else can follow to recreate the bug or error on their own.
- Provide project and platform versions (nodejs, npm, etc), depending on what seems relevant. If not, please be ready to provide that information if maintainers ask for it.

Once it's filed:

- The project team will label the issue.
- A team member will try to reproduce the issue with your provided steps. If there are no repro steps or no obvious way to reproduce the issue, the team will ask you for those steps. Bugs will not be addressed until they are reproduced.
- If the team is able to reproduce the issue it will be left to be [implemented by someone](#contribute-code).
- If you or the maintainers don't respond to an issue for 30 days, the issue will be closed. If you want to come back to it, reply (once, please), and we'll reopen the existing issue. Please avoid filing new issues as extensions of one you already made.

## Request a Feature

If the project doesn't do something you need or want it to do:

- Open an Issue at https://github.com/grafana/plugin-tools/issues
- Provide as much context as you can about what you're running into.
- Please try and be clear about why existing features and alternatives would not work for you.

Once it's filed:

- The project team will label the issue.
- The project team will evaluate the feature request, possibly asking you more questions to understand its purpose and any relevant requirements. If the issue is closed, the team will convey their reasoning and suggest an alternative path forward.
- If the feature request is accepted it can then be worked on by either a core team member or by anyone in the community who wants to [contribute code](#contribute-code).

Note: The team is unlikely to be able to accept every single feature request that is filed. Please understand if they need to say no.

## Project Setup

So you wanna contribute some code! That's great! This project uses GitHub Pull Requests to manage contributions, so [read up on how to fork a GitHub project and file a PR](https://guides.github.com/activities/forking) if you've never done it before.

If this seems like a lot or you aren't able to do all this setup, you might also be able to [edit the files directly](https://help.github.com/articles/editing-files-in-another-user-s-repository/) without having to do any of this setup. Yes, [even code](#contribute-code).

If you want to go the usual route and run the project locally, though:

- [Install Node.js](https://nodejs.org/en/download/)
- [Fork the project](https://guides.github.com/activities/forking/#fork)

Then in your terminal:

- `cd path/to/your/clone`
- `npm install`
- `npm run test && npm run build`

And you should be ready to go!

### Commands

Plugin-tools is a mono-repo consisting of multiple projects. Please refer to their contributing guides to understand how to develop each one.

| Package Name  | Readme                                                   |
| ------------- | -------------------------------------------------------- |
| Create Plugin | [Link](./packages/create-plugin/CONTRIBUTING.md)         |
| ESlint Plugin | [Link](./packages/eslint-plugin-plugins/CONTRIBUTING.md) |
| Plugin E2E    | [Link](./packages/plugin-e2e/CONTRIBUTING.md)            |
| Sign Plugin   | [Link](./packages/sign-plugin/CONTRIBUTING.md)           |
| TSconfig      | [Link](./packages/tsconfig/CONTRIBUTING.md)              |
| Website       | [Link](./docusaurus/website/CONTRIBUTING.md)             |

## Contributor License Agreement (CLA)

Before we can accept your pull request, you need to [sign our CLA](https://grafana.com/docs/grafana/latest/developers/cla/). If you haven't, our CLA assistant prompts you to when you create your pull request.

## Contribute Documentation

Documentation is a super important, critical part of this project. Docs are how we keep track of what we're doing, how, and why. It's how we stay on the same page about our policies. And it's how we tell others everything they need in order to be able to use this project -- or contribute to it. So thank you in advance.

Documentation contributions of any size are welcome! Feel free to file a PR even if you're just rewording a sentence to be more clear, or fixing a spelling mistake!

To contribute documentation:

- [Set up the project](#project-setup).
- Run `npm run docs` to start a development server for the [documentation website](./docusaurus/website/).
- Edit or add any relevant [documentation](./docusaurus/docs/).
- Make sure your changes are formatted correctly and consistently with the rest of the documentation.
- Re-read what you wrote, and run a spellchecker on it to make sure you didn't miss anything.
- Go to https://github.com/grafana/plugin-tools/pulls and open a new pull request with your changes.
- Please make use of the Pull Request Template. If your PR is connected to an open issue, add a line in your PR's description that says `Fixes: #123`, where `#123` is the number of the issue you're fixing.
- If you are a maintainer add the `type/docs` and `no-changelog` labels to the PR.

Once you've filed the PR:

- One or more maintainers will use GitHub's review feature to review your PR.
- If the maintainer asks for any changes, edit your changes, push, and ask for another review.
- If the maintainer decides to pass on your PR, they will thank you for the contribution and explain why they won't be accepting the changes. That's ok! We still really appreciate you taking the time to do it, and we don't take that lightly. 💚
- If your PR gets accepted, it will be marked as such, and merged into the `latest` branch soon after. Your contribution will be distributed to the masses once the PR is merged.

Redirects:

- In case you have to add a redirect - you can add a new entry to the config section of the following plugin `@docusaurus/plugin-client-redirects` in [docusaurus configuration file](./docusaurus/website/docusaurus.config.base.ts).

## Contribute Code

We like code commits a lot! They're super handy, and they keep the project going and doing the work it needs to do to be useful to others. Before considering contributing code please review [report an error or bug](#report-an-error-or-bug) and [request a feature](#request-a-feature) to make sure an issue has been filed and discussed with the project maintainers. PRs submitted without associated issues risk being closed or rejected.

Code contributions of just about any size are acceptable!

The main difference between code contributions and documentation contributions is that contributing code requires inclusion of relevant tests for the code being added or changed. Contributions without accompanying tests will be held off until a test is added, unless the maintainers consider the specific tests to be either impossible, or way too much of a burden for such a contribution.

To contribute code:

- [Set up the project](#project-setup).
- Review the CONTRIBUTING.md file for the package/s you are working on.
- Make any necessary changes to the source code.
- Include any [additional documentation](#contribute-documentation) the changes might need.
- Write tests that verify that your contribution works as expected.
- Go to https://github.com/grafana/plugin-tools/pulls and open a new pull request with your changes.
- Please make use of the Pull Request Template. If your PR is connected to an open issue, add a line in your PR's description that says `Fixes: #123`, where `#123` is the number of the issue you're fixing.

Once you've filed the PR:

- Barring special circumstances, maintainers will not review PRs until all checks pass.
- One or more maintainers will use GitHub's review feature to review your PR.
- If the maintainer asks for any changes, edit your changes, push, and ask for another review. Additional tags (such as `needs-tests`) will be added depending on the review.
- If the maintainer decides to pass on your PR, they will thank you for the contribution and explain why they won't be accepting the changes. That's okay! We still really appreciate you taking the time to do it, and we don't take that lightly. 💚
- If your PR gets accepted, it will be marked as such, and merged into the `main` branch soon after. Your contribution will be distributed to the masses next time the maintainers [create a release](#create-a-release)

## Preview Your Changes Before Release

Whilst developing new features it's possible to publish and install preview builds of every affected package using [pkg.pr.new](https://pkg.pr.new) — a free open-source service that builds and hosts SHA-keyed npm tarballs.

To opt in:

1. Add the `preview` label to your PR.
2. CI builds every workspace and publishes the affected packages to pkg.pr.new.
3. The [`pkg-pr-new[bot]`](https://github.com/apps/pkg-pr-new) posts a comment on the PR with one installable URL per affected package.

Consumers install the preview by URL:

```bash
npm i https://pkg.pr.new/grafana/plugin-tools/@grafana/<package-name>@<commit-sha>
```

For CLI packages (`create-plugin`, `plugin-docs-cli`, `plugin-meta-extractor`, `plugin-types-bundler`, `react-detect`, `sign-plugin`), you can also run the binary directly without installing:

```bash
npx https://pkg.pr.new/grafana/plugin-tools/@grafana/<cli-package>@<commit-sha>
```

> [!IMPORTANT]
> The URL keys off the commit SHA, not a real semver version. Any `package.json` reference to a pkg.pr.new URL must be swapped back to the published version once the PR is merged and released.

When you push new commits to a PR with the `preview` label, the existing pkg.pr.new comment is updated in place with the new commit SHA.

## Create A Release

Releases are managed by [release-please](https://github.com/googleapis/release-please). Each PR's title is the source of truth for version bumps and changelog entries — there are no semver labels to apply.

### PR titles: Conventional Commits

Every merged PR title must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>
```

The PR-title check (`.github/workflows/check-pr-title.yml`) blocks merges when the title doesn't match. Renovate emits `chore(deps): ...` titles automatically; contributors handle their own.

#### Bump mapping

| Title prefix                                                          | Bump (≥1.0) | Bump (0.x)¹ | Changelog section           |
| --------------------------------------------------------------------- | ----------- | ----------- | --------------------------- |
| `feat:` / `feat(scope):`                                              | minor       | minor       | Features                    |
| `fix:` / `fix(scope):`                                                | patch       | patch       | Bug Fixes                   |
| `perf:`                                                               | patch       | patch       | Performance                 |
| `feat!:` / `BREAKING CHANGE:` footer                                  | major       | minor       | Breaking Changes            |
| `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `style`, `revert` | no bump     | no bump     | Hidden — no changelog entry |

¹ `bump-minor-pre-major: true` in `release-please-config.json` preserves the project's historical behaviour for 0.x packages — `feat:` produces a minor bump rather than the release-please default of patch.

### How a release happens

1. **PRs merge to `main`.** Each conventional-commit PR title joins the history.
2. **release-please opens a release PR** automatically (titled `chore: release main`). The PR lists every package being bumped, the new versions, and the per-package changelog entries.
3. **A maintainer reviews and merges the release PR.** First human gate — review the diff, edit changelog text inline if needed, then merge.
4. **The release workflow (`.github/workflows/release-please.yml`) runs on the merge to `main`** in two jobs:
   - **`release` job** — release-please-action creates per-package git tags (`@grafana/<pkg>@<version>`) and GitHub Releases. Always runs on every push.
   - **`publish` job** — gated by the `npm-publish` GitHub environment. Reviewers configured on the environment receive a deployment-approval prompt in the Actions UI; the job pauses until someone approves. Second human gate.
5. **Once the publish job is approved**, it builds every workspace, stages each bumped package on npm via `npm stage publish --provenance --access public` (OIDC-authenticated; no 2FA required for the stage step), and posts a Slack notification listing each staged package with links to its GitHub release and npm page.

Staged packages are uploaded to the npm registry but **not yet live**. They need explicit approval on npmjs.com before consumers can install them — see the next section.

### Approving staged packages on npm

After the Slack notification fires:

1. Log into [npmjs.com](https://www.npmjs.com/) with the 2FA-enabled account that has publish rights to `@grafana/*` packages.
2. For each `@grafana/<pkg>` in the Slack message, navigate to its staged-packages view.
3. Verify the staged versions then **Approve** each to send them to the NPM registry.

If you spot a problem with a staged package before approving, **Reject** removes the staged version without publishing.
