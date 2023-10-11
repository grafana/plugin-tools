// @ts-check
const core = require('@actions/core');
const { context, getOctokit } = require('@actions/github');

const prMessageSymbol = `<!-- plugin-tools-auto-check-labels-comment -->`;
const prIntroMessage = `Hello! 👋 This repository uses [Auto](https://intuit.github.io/auto/) for releasing packages using PR labels.`;
const prMessageLabelDetails = `<details><summary>🏷️ More info about which labels to use</summary>
<br />

- If the changes only affect the docs website, documentation, or this repository's tooling add the \`no-changelog\` label.
- If there are changes to any of the npm packages src files please choose from one of the following labels:
- 🐛 if this PR fixes a bug add the \`patch\` label
- 🚀 if this PR includes an enhancement add the \`minor\` label
- 💥 if this PR includes a breaking change add the \`major\` label
- Optionally, if you would like this PR to publish new versions of packages when it is merged add the \`release\` label.
</details>
`;

async function run() {
  try {
    const {
      payload: { pull_request },
      repo,
    } = context;
    const labels = pull_request?.labels || [];
    const labelNames = labels.map((label) => label.name);
    const githubToken = core.getInput('github-token');
    const octokit = getOctokit(githubToken);
    // @ts-ignore - prNumber always exists because the workflow uses the pull_request event.
    const prNumber = pull_request.number;
    const requiredOneOfLabels = ['patch', 'minor', 'major', 'no-changelog'];
    const attachedSemverLabels = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const previousCommentId = await getPreviousComment({ octokit, repo, prNumber });
    const isMissingSemverLabel = attachedSemverLabels.length === 0;
    const hasMultipleSemverLabels = attachedSemverLabels.length > 1;
    const hasOneSemverLabel = attachedSemverLabels.length === 1;
    const hasReleaseLabel = labelNames.includes('release');

    console.log({
      prNumber,
      requiredOneOfLabels,
      attachedSemverLabels,
      previousCommentId,
      isMissingSemverLabel,
      hasMultipleSemverLabels,
      hasOneSemverLabel,
      hasReleaseLabel,
    });

    if (isMissingSemverLabel) {
      let errorMsg = [
        'Please address the following issues:',
        '\n- This PR is **missing** one of the following labels: `patch`, `minor`, `major`, `no-changelog`.',
      ];
      if (!hasReleaseLabel) {
        errorMsg.push('- (Optional) This PR is missing the `release` label.');
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${errorMsg.join('\n')}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.error('This PR is missing one of the following labels: `patch`, `minor`, `major`, `no-changelog`.');
      core.setFailed('Missing semver label');
    }

    if (hasMultipleSemverLabels) {
      let errorMsg = [
        'Please address the following issues:',
        '\n- This PR contains **multiple** semver labels. A PR can only include one of: `patch`, `minor`, `major`, `no-changelog` labels.',
      ];

      if (!hasReleaseLabel) {
        errorMsg.push('- (Optional) This PR is missing the `release` label.');
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${errorMsg.join('\n')}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.error(
        'This PR contains multiple semver labels. A PR can only include one of: `patch`, `minor`, `major`, `no-changelog` labels.'
      );
      core.setFailed('Multiple semver labels');
    }

    if (hasOneSemverLabel && attachedSemverLabels[0] !== 'no-changelog') {
      let warning = '';
      if (hasReleaseLabel) {
        warning = `This PR will trigger a new \`${attachedSemverLabels[0]}\` release when merged.`;
      } else {
        warning = `This PR has required semver label \`${attachedSemverLabels[0]}\` but is missing the \`release\` label. This PR can be merged but will not trigger a new release.`;
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${warning}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.notice(warning);
      core.setOutput('canMerge', warning);
    }

    if (hasOneSemverLabel && attachedSemverLabels[0] == 'no-changelog') {
      if (hasReleaseLabel) {
        const error =
          'This PR includes conflicting labels `no-changelog` and `release`. Please either replace `no-changelog` with a semver related label or remove the `release` label.';
        const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelDetails}`;
        await doComment({ octokit, previousCommentId, message, repo, prNumber });
        core.error(
          'This PR includes conflicting labels `no-changelog` and `release`. Please either replace `no-changelog` with a semver related label or remove the `release` label.'
        );
        core.setFailed(error);
      } else {
        const warning =
          'This PR can be merged. It will not be considered when calculating future releases and will not appear in the changelogs.';
        const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${warning}`;

        await doComment({ octokit, previousCommentId, message, repo, prNumber });
        core.notice(
          'This PR can be merged. It will not be considered when calculating future releases and will not appear in the changelogs.'
        );
        core.setOutput('canMerge', warning);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getPreviousComment({ octokit, repo, prNumber }) {
  const { data } = await octokit.rest.issues.listComments({
    ...repo,
    issue_number: prNumber,
  });

  let previousCommentId;
  for (const { body, id } of data) {
    if (body?.includes(prMessageSymbol)) {
      previousCommentId = id;
    }
  }
  return previousCommentId;
}

async function doComment({ octokit, previousCommentId, message, repo, prNumber }) {
  try {
    if (previousCommentId) {
      await octokit.rest.issues.updateComment({
        ...repo,
        comment_id: previousCommentId,
        body: message,
      });
    } else {
      await octokit.rest.issues.createComment({
        ...repo,
        issue_number: prNumber,
        body: message,
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
