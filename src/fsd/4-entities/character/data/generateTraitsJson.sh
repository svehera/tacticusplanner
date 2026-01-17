#!/bin/bash

# Since we do not have a JSON manifest of what traits exist and their icons,
# we need to make our our.

# This script starts the process by generating a JSONC file that lists out all
# the traits found in the character data. They appear there as the 'key' to the trait.
# The user-facing name and icon need to be filled in manually after this file is generated.
# The primary purpose of this script is to ensure that all traits used in the character
# data are captured here and can then be used by type definitions to ensure completeness.

# The input files are:
# - ./newCharacterData.json
# - ./newNpcData.json
# The output file is:
# - ./traits-generated.json

# The output file will contain a JSON object where each key is a trait key found.
# The corresponding value will be null since we don't have the user-facing name or icon yet.
# The reasons for this instead of is because TypeScript treats keys as string literals but
# values as more variable types (e.g. string | null), so this format is more useful for type definitions.

# Step 1: Extract all unique trait keys from both JSON files using `jq` and other shell tools
traits=$(jq -r '.[] | .Traits[]?' newCharacterData.json newNpcData.json | sort -u)

# Step 2: Generate the JSONC file using `jq` so that it is properly formatted
jq -n --arg traits "$traits" \
    '($traits | split("\n") | map(select(length > 0)) | map({key: ., value: null}) | from_entries)' \
    > traits-generated.json
