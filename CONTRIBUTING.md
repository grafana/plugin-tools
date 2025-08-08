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
  - [Create a Release](#create-a-release)
    - [Release Version Calculation](#release-version-calculation)
    - [Help! The release failed after the packages were published to the NPM registry](#help-the-release-failed-after-the-packages-were-published-to-the-npm-registry)

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

## Create A Release

Releases are managed by [Auto](https://intuit.github.io/auto/index) and PR labels.

> [!WARNING]
> When merging a PR with the `release` label please avoid merging another PR. For further information [see here](https://intuit.github.io/auto/docs/welcome/quick-merge#with-skip-release).

When opening a PR please attach the necessary label for the change so releases are dealt with appropriately:

- **major** -> 💥 Breaking Change
- **minor** -> 🚀 Enhancement
- **patch** -> 🐛 Bug Fix
- **no-changelog** -> 🙈 Don't impact versioning.

If you would like the PR to automatically publish a new release of a package when merged you should also add the `release` label to the PR. This is done using the [`onlyPublishWithReleaseLabel`](https://intuit.github.io/auto/docs/configuration/autorc#only-publish-with-release-label) flag to allow us greater control on when a release occurs.

Bear in mind not every PR needs to make a version bump to a package. Please be mindful when labelling PRs.

When a merge to the `main` branch occurs a github workflow will run `npm run release` which in turn calls `auto shipit`. The `auto shipit` command does the following things:

1. **Check for 'release' Label**: 🔍 The command only triggers version bumps if the merged PR has a 'release' label.
2. **Version Calculation**: 🧮 Determines the appropriate version bump per package by analyzing the labels of merged PRs since the last GH release.
3. **Changelog Updates**: 📝 The command updates the CHANGELOG.md for affected packages and possibly the root CHANGELOG.md.
4. **Commit and Tag**: 🏷️ It commits these changes and tags the repository.
5. **GitHub Release Creation**: 📄 Creates a GitHub release for the new version.
6. **NPM Publishing**: 🚀 If the conditions are met (e.g., 'release' label present), it publishes the packages to NPM.
7. **Push Changes and Tags**: ⬆️ Finally, it pushes the version number, changelog updates, and tags to the repository.

### Release Version Calculation

Below is a bulleted list of what occurs under the hood when Auto is asked to release packages.

1. Get latest release info from Github
2. Get info for all merged PRs after the publish date of latest release
3. Use the semver labels assigned to each of the merged PRs (`Major`, `Minor`, and `Patch`) to understand how to bump changed packages
4. Pass the latest release tag and the calculated version bump to Lerna
5. Lerna diffs each package workspace (since the latest release tag) to find which have changed and need to be published
6. Lerna bumps each changed package using the calculated version bump in step 3
7. Lerna publishes each package

> [!TIP]
> We enable verbose logging in the release packages CI step to give plenty of information related to what Auto and Lerna are doing. This can prove most useful should issues occur with releasing packages.

### Help! The release failed after the packages were published to the NPM registry

If the release step fails after the packages were published to the NPM registry manual clean up is required to sync the repo to the NPM registry before the next publish occurs otherwise further failures or potentially major releases containing duplicate version calculations could be pushed to the NPM registry.

To sync the repo with the latest release(s) on the NPM registry we need to introduce the commits, tags and gh releases Auto _would_ have pushed had the publish command completed fully.

- Locate the failed release workflow step from the `main` commit history.
- Search the logs for `Commit  - @grafana/` to find the versions and `git tag` commands for each package that was published to the NPM registry.
- Search the logs for `New Release Notes` to find the release notes markdown.
- Checkout `main`.
- For each published package update it's `changelog.md` file in the repo using the release notes markdown as a guide. It will not match each changelog file perfectly but the older entries can be used to match formatting. Now update the repos root `changelog.md` file, matching the formatting using older entries. Commit this to `main` with `git commit -m "Update CHANGELOG.md [skip ci]"`. ([example commit](https://github.com/grafana/plugin-tools/commit/e8b980e25e8752aaab9278cb43228f44733ca96f))
- Update each published packages `package.json` file so the version matches the version published to the registry. Once done run `npm install`. Commit this to `main` with `git commit -m "Bump independent versions [skip ci]"`.
- Now tag this version bump commit with the tag commands from the failed release workflow step. Tag the commit for each published package. The command should look like `git tag -a @grafana/create-plugin@<UPDATED_VERSION> -m "@grafana/create-plugin@<UPDATED_VERSION>"`. ([example commit](https://github.com/grafana/plugin-tools/commit/e8b980e25e8752aaab9278cb43228f44733ca96f))
- Go to the [plugin-tools tags page](https://github.com/grafana/plugin-tools/tags) and delete any existing tags that match the versions of the packages that were released.
- Once the tags are deleted push the commits and the tags from `main` to gh with `git push --follow-tags`.
- Lastly create the GH releases for the packages from the [Github releases page](https://github.com/grafana/plugin-tools/releases).
