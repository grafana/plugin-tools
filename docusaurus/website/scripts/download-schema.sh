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


echo "Schema download complete!"
