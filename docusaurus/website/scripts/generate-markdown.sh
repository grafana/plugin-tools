#!/bin/bash

# Script generate markdown files from the Grafana plugin schema JSON file

# Exit on error
set -e

INPUT_FILE="$(dirname "$0")/plugin.schema.json"
PARTIALS="$(dirname "$0")/partials"
OUTPUT_FILE="$(dirname "$0")/../../docs/reference/metadata.md"

# Verify the downloaded file
if [ ! -s "$INPUT_FILE" ]; then
    echo "Error: input schema doesn't exist or is empty" >&2
    rm -f "$INPUT_FILE"
    exit 1
fi

npx --yes jsonschema2mk --partials "$PARTIALS" --schema "$INPUT_FILE" > "$OUTPUT_FILE"

# Detect OS and set sed options accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_OPTS="-i ''"
else
    SED_OPTS="-i"
fi

# Replace the string # plugin\.json with the desired content in the OUTPUT_FILE
sed $SED_OPTS 's|# plugin\\.json|---\nid: plugin-json\ntitle: Metadata (plugin.json)\ndescription: Reference for the Grafana plugin.json metadata file.\nkeywords:\n  - grafana\n  - plugins\n  - documentation\n  - plugin.json\n  - API reference\n  - API\nsidebar_position: 10\n---\n\n# Plugin metadata (plugin.json)|' "$OUTPUT_FILE"

rm -f "$INPUT_FILE"

echo "Markdown generation complete!"