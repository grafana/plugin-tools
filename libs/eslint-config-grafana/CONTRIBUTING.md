## Contributing

To contribute to this project, begin by cloning or forking the repository.

Ensure you have all dependencies installed by navigating to the project folder and running:

```shell
yarn install
```

### Creating a Feature Branch

Before making changes, create a new feature branch. This helps keep your work isolated and makes it easier to review.

```shell
git checkout master
git pull master
git checkout -b <feature-branch-name>
```

### Checking Issues First

Before working on a new feature or bug fix, please check the open issues in the repository. If there's an issue related to what you're working on, comment on it to let others know you'd like to work on it. This helps avoid duplicated efforts.

If there isn't an existing issue, consider creating one to provide visibility and context for your contribution.

### Updating the Changelog

When making changes that warrant a version update, please append to the changelog. The changelog helps others understand what has changed between releases.

Add a new entry to the changelog with a summary of your changes and the relevant version. Be sure to do this when updating the version number.

### Publishing

Publishing is handled by a GitHub workflow, which is triggered whenever there is a merge to `master` that contains a change to the version property in the `package.json` file. You can either update the version manually or use the command below to version bump, commit, and tag.

```shell
npm version [<newversion> | major | minor | patch ]
```

### Versioning

It's probable that _any_ change will be a breaking one, so it's best to stick to major version releases whenever possible.

### Submitting a Pull Request

When your changes are ready, push your feature branch to the remote repository and open a pull request (PR) against the `master` branch. In your PR description, provide a clear summary of the changes, including any relevant issue numbers. Request a review, and address any feedback provided by reviewers.

Thanks for your contribution!
