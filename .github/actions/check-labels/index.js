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
    const githubToken = core.getInput('repo-token', { required: true });
    const prNumber = pull_request?.number;

    const requiredOneOfLabels = ['patch', 'minor', 'major', 'skip-changelog'];
    const hasSemverLabel = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const hasReleaseLabel = labelNames.includes('release');
    const prMessageSymbol = `<!-- plugin-tools-auto-check-labels-comment -->`;
    const prMessage = `👋 This repository uses [Auto](https://intuit.github.io/auto/) for releasing packages using PR labels.`;
    const prMessageIssues = [];

    console.log({
      labels,
      labelNames,
      prNumber,
    });

    const octokit = getOctokit(githubToken);

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

    console.log({ previousCommentId });

    // await octokit.rest.issues.createComment({
    //   ...repo,
    //   issue_number: prNumber,
    //   body: prMessage,
    // });

    if (hasSemverLabel.length === 0) {
      core.setFailed('PR is missing one of the following labels: `patch`, `minor`, `major`, `skip-changelog`');
    }

    if (hasSemverLabel.length > 1) {
      core.setFailed(
        'PR contains multiple semver labels. A PR can only include one of: `patch`, `minor`, `major`, `skip-changelog` labels.'
      );
    }

    if (hasSemverLabel.length === 1 && !hasReleaseLabel) {
      core.setOutput(
        'canMergeWithoutPublish',
        'PR has required semver label but missing `release` label. This PR can be merged but will not trigger a new release.'
      );
    }

    core.setOutput('willPublish', 'PR will trigger a new `${hasSemverLabel}` release.');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
