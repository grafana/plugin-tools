This directory contains internal libraries that share functionality across the packages. They are private npm workspaces and are not published to the npm registry. Any package that wishes to consume them should do the following:

1. Add the lib as a dev dependency to the workspaces package.json
2.
