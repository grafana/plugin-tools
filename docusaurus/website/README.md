# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Search

Search functionality is handled by a "local search" index built using (docusaurus-plugin-lunr)[https://github.com/daldridge/docusaurus-plugin-lunr]. Search is only available in a production build of the website. To view this locally run the following commands:

```
$ npm run build
$ npm run serve
```

### Redirects

When moving a file, create a client-side redirect so as not to break links from the old location. It is a best practice to also manually update old links to the new location whenever possible.

Insert the client-side redirect here: /plugin-tools/docusaurus/website/docusaurus.config.base.js into the [configuration section](https://github.com/grafana/plugin-tools/blob/0d436bb669a5f3ca37ea267d97e88cfa8508a25e/docusaurus/website/docusaurus.config.base.js#L63) of `@docusaurus/plugin-client-redirects`. The format is:

```
{
    from: ['/something-that-does-not-exist', '/something-that-does-not-exist/testing'],
    to: '/get-started/folder-structure',
},

```
`from` - being the old location and `to` being the new one. You can have multiple `from` urls for a single `to` url.


To test that the redirect works prior to publishing the PR deploy your branch to DEV Stage of developer portal. You can do so by [running this action](https://github.com/grafana/plugin-tools/actions/workflows/deploy-to-developer-portal-dev.yml) called `Deploy to Developer Portal DEV Bucket`.

Hit the `run workflow` button and choose following parameters:
- Use workflow from: Branch `main` (keep it as it is by default)
- Which branch to use? Here you should enter your branch name.
- Hit the `run workflow` button