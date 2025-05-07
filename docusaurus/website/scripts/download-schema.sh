#!/bin/bash

# Script to download the Grafana plugin schema JSON file
# and store it locally in the same directory

# Exit on error
set -e

# Define variables
SCHEMA_URL="https://raw.githubusercontent.com/grafana/grafana/main/docs/sources/developers/plugins/plugin.schema.json"
OUTPUT_FILE="$(dirname "$0")/plugin.schema.json"

echo "Downloading Grafana plugin schema..."

# Download the file
if curl -s -f -o "$OUTPUT_FILE" "$SCHEMA_URL"; then
    echo "Schema successfully downloaded to $OUTPUT_FILE"
else
    echo "Error: Failed to download schema from $SCHEMA_URL" >&2
    exit 1
fi

# Verify the downloaded file
if [ ! -s "$OUTPUT_FILE" ]; then
    echo "Error: Downloaded file is empty" >&2
    rm -f "$OUTPUT_FILE"
    exit 1
fi

# Detect OS and set sed options accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_OPTS="-i ''"
else
    SED_OPTS="-i"
fi

# Replace patterns with backticks
sed $SED_OPTS 's/'\''{PLUGIN_ID}\/name-of-component\/v1'\''/`{PLUGIN_ID}\/name-of-component\/v1`/g' "$OUTPUT_FILE"
sed $SED_OPTS 's/'\''{PLUGIN_ID}\/name-of-my-extension-point\/v1'\''/`{PLUGIN_ID}\/name-of-my-extension-point\/v1`/g' "$OUTPUT_FILE"


echo "Schema download complete!"
