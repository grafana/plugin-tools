# Internal Libraries

This directory contains internal libraries that share common functionality across the packages. They are private npm workspaces and are not published to the npm registry. Any package that wishes to consume these libs should do the following:

1. Add the lib as a devDependency to the workspaces package.json matching the version to the version declared in the libs package.json.
2. Run `npm install` in the root of the repo.
3. Now import the package like any other `import {exportedVal} from @libs/<name_of_lib>`

> [!WARNING] It is important that the lib is declared as a devDependency. If it is added as any other dependency type it will be externalised during the build process and break installation of the consuming package as none of these libs exist in the NPM repository.
