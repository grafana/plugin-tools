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


# Add docusaurus header to the top of the file
sed -i.bak "1i\\
---\\
id: plugin-json\\
title: Metadata (plugin.json)\\
description: Reference for the Grafana plugin.json metadata file.\\
keywords:\\
  - grafana\\
  - plugins\\
  - documentation\\
  - plugin.json\\
  - API reference\\
  - API\\
sidebar_position: 10\\
---\\
\\
# Plugin metadata (plugin.json)
" "$OUTPUT_FILE"

rm -f "$INPUT_FILE"
rm -f "$OUTPUT_FILE.bak"

echo "Markdown generation complete!"