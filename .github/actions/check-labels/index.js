// @ts-check
const core = require('@actions/core');
const { context, getOctokit } = require('@actions/github');

async function run() {
  try {
    const {
      payload: { pull_request },
      repo,
    } = context;
    const labels = pull_request?.labels || [];
    const labelNames = labels.map((label) => label.name);
    const githubToken = core.getInput('github-token');
    const prNumber = pull_request?.number;

    const requiredOneOfLabels = ['patch', 'minor', 'major', 'skip-changelog'];
    const attachedSemverLabels = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const hasReleaseLabel = labelNames.includes('release');
    const prMessageSymbol = `<!-- plugin-tools-auto-check-labels-comment -->`;
    const prIntroMessage = `👋 This repository uses [Auto](https://intuit.github.io/auto/) for releasing packages using PR labels.`;
    const prMessageLabelExplanation = `
    If there are changes to any of the npm packages src files please choose from one of the following labels:
    - **patch** -> 🐛 if this PR includes a bug fix
    - **minor** -> 🚀 if this PR includes an enhancement
    - **major** -> 💥 if this PR includes a breaking change

    If the changes only affect the repo CI, tooling or the docs website and/or documentation files please consider using the **skip-changelog** label.
    `;
    const octokit = getOctokit(githubToken);

    const { data } = await octokit.rest.issues.listComments({
      ...repo,
      // @ts-ignore - prNumber always exists because the workflow uses the pull_request event.
      issue_number: prNumber,
    });

    let previousCommentId;
    for (const { body, id } of data) {
      if (body?.includes(prMessageSymbol)) {
        previousCommentId = id;
      }
    }

    if (attachedSemverLabels.length === 0) {
      const error = 'This PR is missing one of the following labels: `patch`, `minor`, `major`, `skip-changelog`.';
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelExplanation}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.setFailed(error);
    }

    if (attachedSemverLabels.length > 1) {
      const error =
        'This PR contains multiple semver labels. A PR can only include one of: `patch`, `minor`, `major`, `skip-changelog` labels.';
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelExplanation}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.setFailed(error);
    }

    if (attachedSemverLabels.length === 1 && !hasReleaseLabel) {
      const warning =
        'This PR has a required semver label `${attachedSemverLabels}[0]` but is missing the `release` label. This PR can be merged but will not trigger new releases.';
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${warning}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.setOutput('canMergeWithoutPublish', warning);
    }

    core.setOutput('willPublish', 'This PR will trigger a new `${hasSemverLabel}` release when merged.');
  } catch (error) {
    core.setFailed(error.message);
  }
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
