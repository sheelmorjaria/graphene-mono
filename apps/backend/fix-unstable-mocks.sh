#!/bin/bash

# Script to fix jest.unstable_mockModule issues

echo "Fixing unstable mock module issues..."

# Find all test files with unstable_mockModule and replace with regular jest.mock
find src -name "*.test.js" -type f -exec grep -l "jest.unstable_mockModule" {} \; | while read file; do
    echo "Processing: $file"
    
    # Replace jest.unstable_mockModule with jest.mock
    sed -i 's/jest\.unstable_mockModule(/jest.mock(/g' "$file"
    
    # Fix import statements that use await import to regular import
    sed -i 's/const .* = await import(/import /g' "$file"
    sed -i 's/\.default//g' "$file"
    
    echo "Fixed: $file"
done

echo "Completed fixing unstable mock module issues."