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
    // @ts-ignore - prNumber always exists because the workflow uses the pull_request event.
    const prNumber = pull_request.number;

    const requiredOneOfLabels = ['patch', 'minor', 'major', 'skip-changelog'];
    const attachedSemverLabels = labelNames.filter((label) => requiredOneOfLabels.includes(label));
    const hasReleaseLabel = labelNames.includes('release');
    const prMessageSymbol = `<!-- plugin-tools-auto-check-labels-comment -->`;
    const prIntroMessage = `Hello! 👋 This repository uses [Auto](https://intuit.github.io/auto/) for releasing packages using PR labels. Please address the following issues:`;
    const prMessageLabelDetails = `<details><summary>🏷️ More info about how labels work</summary>

- If the changes only affect the docs website, documentation, or this repository's tooling add the \`skip-changelog\` label.
- If there are changes to any of the npm packages src files please choose from one of the following labels:
  - 🐛 if this PR fixes a bug add the \`patch\` label
  - 🚀 if this PR includes an enhancement add the \`minor\` label
  - 💥 if this PR includes a breaking change add the \`major\` label
- Optionally, if you would like this PR to publish new versions of packages when it is merged add the \`release\` label.
</details>
    `;

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

    if (attachedSemverLabels.length === 0) {
      let error = '- This PR is **missing** one of the following labels: `patch`, `minor`, `major`, `skip-changelog`.';
      if (!hasReleaseLabel) {
        error += '\n\n- (Optional) This PR is missing the `release` label.';
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.setFailed(error);
    }

    if (attachedSemverLabels.length > 1) {
      let error =
        '- This PR contains **multiple** semver labels. A PR can only include one of: `patch`, `minor`, `major`, `skip-changelog` labels.';
      if (!hasReleaseLabel) {
        error += '\n\n- (Optional) This PR is missing the `release` label.';
      }
      const message = `${prMessageSymbol}\n${prIntroMessage}\n\n${error}\n\n${prMessageLabelDetails}`;

      await doComment({ octokit, previousCommentId, message, repo, prNumber });
      core.setFailed(error);
    }

    if (attachedSemverLabels.length === 1 && !hasReleaseLabel) {
      const warning =
        'This PR has a required semver label (`${attachedSemverLabels}[0]`) but is missing the `release` label. This PR can be merged but will not trigger new releases.';
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
