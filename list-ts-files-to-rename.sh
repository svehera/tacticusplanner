#!/bin/bash

# List all TypeScript (.ts and .tsx) filenames that need to be converted to kebab-case

# Function to convert string to kebab-case
to_kebab_case() {
    local filename="$1"
    local extension="${filename##*.}"
    local basename="${filename%.*}"
    
    # Insert hyphens before uppercase letters (but not at the start)
    local kebab=$(echo "$basename" | sed -E 's/([a-z])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]')
    
    # Remove multiple consecutive hyphens (just in case)
    kebab=$(echo "$kebab" | sed 's/-\+/-/g')
    
    echo "${kebab}.${extension}"
}

echo "TypeScript files that need renaming to kebab-case:"
echo "=================================================="
echo ""

count=0

# Find all .ts and .tsx files, excluding node_modules and .git
while IFS= read -r file; do
    filename=$(basename "$file")
    new_filename=$(to_kebab_case "$filename")
    
    # Only show files where the name changes
    if [[ "$filename" != "$new_filename" ]]; then
        echo "$file -> $new_filename"
        ((count++))
    fi
done < <(find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*")

echo ""
echo "Total files to rename: $count"
