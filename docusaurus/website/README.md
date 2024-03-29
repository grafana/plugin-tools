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
