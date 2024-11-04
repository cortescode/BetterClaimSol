#!/bin/bash

# Define source and destination directories
SOURCE_DIR="./frontend/dist"
DEST_DIR="./backend/public"

# Check if source directory exists
if [ -d "$SOURCE_DIR" ]; then
    # Create destination directory if it doesn't exist
    mkdir -p "$DEST_DIR"
    
    # Copy contents from source to destination
    cp -r "$SOURCE_DIR"/* "$DEST_DIR"
    
    echo "Files copied from $SOURCE_DIR to $DEST_DIR successfully."
else
    echo "Source directory $SOURCE_DIR does not exist."
    exit 1
fi