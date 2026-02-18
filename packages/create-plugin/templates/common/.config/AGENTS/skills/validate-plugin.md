# Validate Grafana Plugin

## Important

Always use the bash commands below directly. Do NOT use MCP tools for validation.

## Usage

```
/validate-plugin [path-to-plugin-dir]
```

If no path is provided, defaults to the current directory.

## Steps

1. Check if `npx` or `docker` is available. npx is preferred, docker is the fallback:
   ```bash
   command -v npx >/dev/null 2>&1 && echo "VALIDATOR=npx" || { command -v docker >/dev/null 2>&1 && echo "VALIDATOR=docker"; } || echo "VALIDATOR=none"
   ```
   If neither is found (`VALIDATOR=none`), stop immediately and tell the user: "Neither npx nor docker is installed. Please install Node.js (for npx) or Docker to run the plugin validator."

2. Find `src/plugin.json` (or `plugin.json`) in the plugin directory and extract the plugin ID and whether it has a backend:
   ```bash
   PLUGIN_ID=$(grep '"id"' < src/plugin.json | sed -E 's/.*"id" *: *"(.*)".*/\1/')
   HAS_BACKEND=$(grep -c '"backend" *: *true' src/plugin.json || true)
   ```

3. Build the frontend following the build instructions in `.config/AGENTS/instructions.md`:
   ```bash
   npm run build
   ```
   If the build fails, stop and report the error to the user.

4. If `HAS_BACKEND` is non-zero (backend plugin detected), build the backend following the build instructions in `.config/AGENTS/instructions.md`:
   - The backend must be built using `mage` with the build targets provided by the Grafana plugin Go SDK:
     ```bash
     mage -v
     ```
   - If `mage` is not installed, stop and tell the user: "mage is required to build the backend. Install it from https://magefile.org or run: go install github.com/magefile/mage@latest"
   - If the build fails, stop and report the error to the user.

5. Build the plugin zip archive for validation with a timestamp:
   ```bash
   TIMESTAMP=$(date +%Y%m%d-%H%M%S)
   ZIP_NAME="${PLUGIN_ID}-${TIMESTAMP}.zip"
   cp -r dist "${PLUGIN_ID}"
   zip -qr "${ZIP_NAME}" "${PLUGIN_ID}"
   rm -rf "${PLUGIN_ID}"
   ```

6. Run the validator with JSON output using whichever tool was found in step 1:
   If npx (preferred):
   ```bash
   npx -y @grafana/plugin-validator@latest -jsonOutput -sourceCodeUri file://. "${ZIP_NAME}"
   ```
   If docker (fallback):
   ```bash
   docker run --pull=always \
     -v "$(pwd)/${ZIP_NAME}:/archive.zip:ro" \
     -v "$(pwd):/source:ro" \
     grafana/plugin-validator-cli -jsonOutput -sourceCodeUri file:///source /archive.zip
   ```

7. Read and interpret the JSON output. Summarize:
   - Total errors, warnings, and passed checks
   - List each error with its title and detail
   - List each warning with its title and detail
   - Provide actionable suggestions to fix each issue

8. Inform the user that a zip file was created (include the filename) and suggest they remove it manually when done. Do NOT run `rm` to delete the zip — this tool does not have permission to remove files.
