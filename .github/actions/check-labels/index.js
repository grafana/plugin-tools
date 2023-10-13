// @ts-check
const core = require('@actions/core');
const { context, getOctokit } = require('@actions/github');
const { prMessageSymbol, prIntroMessage, prMessageLabelDetails, prReleaseLabelMessage } = require('./messages');

async function run() {
  try {
    const {
      payload: { pull_request },
    } = context;
    const labels = pull_request?.labels || [];
    const labelNames = labels.map((label) => label.name);
    const githubToken = core.getInput('github-token');
    const octokit = getOctokit(githubToken);

    const requiredOneOfLabels = ['patch', 'minor', 'major', 'no-changelog'];
    const attachedSemverLabels = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const isMissingSemverLabel = attachedSemverLabels.length === 0;
    const hasMultipleSemverLabels = attachedSemverLabels.length > 1;
    const hasOneSemverLabel = attachedSemverLabels.length === 1;
    const hasReleaseLabel = labelNames.includes('release');

    if (isMissingSemverLabel) {
      let errorMsg = [
        '❌ This PR cannot be merged until the following issues are addressed:',
        '\n- **This PR is missing one of the following labels**: `patch`, `minor`, `major`, `no-changelog`.',
      ];
      if (!hasReleaseLabel) {
        errorMsg.push(prReleaseLabelMessage);
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${errorMsg.join('\n')}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, message });
      core.error('This PR is missing one of the following labels: `patch`, `minor`, `major`, `no-changelog`.');
      core.setFailed('Missing semver label');
    }

    if (hasMultipleSemverLabels) {
      let errorMsg = [
        '❌ This PR cannot be merged until the following issues are addressed:',
        '\n- **This PR contains multiple semver labels**. A PR can only include one of: `patch`, `minor`, `major`, `no-changelog` labels.',
      ];

      if (!hasReleaseLabel) {
        errorMsg.push(prReleaseLabelMessage);
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${errorMsg.join('\n')}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, message });
      core.error(
        'This PR contains multiple semver labels. A PR can only include one of: `patch`, `minor`, `major`, `no-changelog` labels.'
      );
      core.setFailed('Multiple semver labels');
    }

    if (hasOneSemverLabel && attachedSemverLabels[0] !== 'no-changelog') {
      let warning = '';
      if (hasReleaseLabel) {
        warning = `✨ This PR can be merged and will trigger a new \`${attachedSemverLabels[0]}\` release.\n**NOTE**: When merging a PR with the \`release\` label please avoid merging another PR. For further information [see here](https://intuit.github.io/auto/docs/welcome/quick-merge#with-skip-release).`;
      } else {
        warning = `✨ This PR can be merged but will not trigger a new release. To trigger a new release add the \`release\` label before merging.\n**NOTE**: When merging a PR with the \`release\` label please avoid merging another PR. For further information [see here](https://intuit.github.io/auto/docs/welcome/quick-merge#with-skip-release).`;
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${warning}`;

      await doComment({ octokit, message });
      core.notice(warning);
      core.setOutput('canMerge', warning);
    }

    if (hasOneSemverLabel && attachedSemverLabels[0] === 'no-changelog') {
      if (hasReleaseLabel) {
        const error =
          '❌ This PR includes conflicting labels `no-changelog` and `release`. Please either replace `no-changelog` with a semver related label or remove the `release` label.';
        const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelDetails}`;

        await doComment({ octokit, message });
        core.error(error);
        core.setFailed(error);
      } else {
        const warning =
          '✨ This PR can be merged. It will not be considered when calculating future versions of the npm packages and will not appear in the changelogs.';
        const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${warning}`;

        await doComment({ octokit, message });
        core.notice(warning);
        core.setOutput('canMerge', warning);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function doComment({ octokit, message }) {
  try {
    const {
      payload: { pull_request },
      repo,
    } = context;
    // @ts-ignore - prNumber always exists because the workflow uses the pull_request event.
    const prNumber = pull_request.number;
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
