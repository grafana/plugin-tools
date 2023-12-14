// @ts-check
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

const prReleaseLabelMessage = '- _Optionally_ if using a `patch`, `minor` or `major` label also add the `release` label if you would like this PR to trigger npm package publishing.';

module.exports = {
  prMessageSymbol,
  prIntroMessage,
  prMessageLabelDetails,
  prReleaseLabelMessage
};
