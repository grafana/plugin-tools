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

# Generate markdown file
npx --yes jsonschema2mk --partials "$PARTIALS" --schema "$INPUT_FILE" > "$OUTPUT_FILE"

# Prettify the markdown file
npx prettier --write "$OUTPUT_FILE"

# Remove files
rm -f "$INPUT_FILE"
rm -f "$OUTPUT_FILE.bak"

echo "Markdown generation complete!"