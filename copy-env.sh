#!/bin/bash

# Define directories to check
DIRS=("." "client" "server" "worker")

for dir in "${DIRS[@]}"; do
  if [ -f "$dir/.env.example" ]; then
    echo "Found .env.example in $dir, copying to .env..."
    cp "$dir/.env.example" "$dir/.env"
    echo "Successfully copied $dir/.env.example to $dir/.env"
  else
    echo "No .env.example found in $dir, skipping..."
  fi
done

echo "Done!" 