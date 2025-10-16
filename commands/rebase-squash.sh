#!/bin/bash

if [ $# -ne 2 ]; then
    echo "Usage: $0 <commit-hash> <commit-message>"
    echo "Example: $0 abc1234567 'Your single commit message'"
    exit 1
fi

COMMIT_HASH=$1
COMMIT_MESSAGE=$2

echo "----------------------------------------"
echo "Git Rebase Squash Operation"
echo "----------------------------------------"
echo "Commit hash: $COMMIT_HASH"
echo "New message: $COMMIT_MESSAGE"
echo "----------------------------------------"
echo "This will:"
echo "1. Reset soft to commit: $COMMIT_HASH"
echo "2. Amend with new message: $COMMIT_MESSAGE"
echo "----------------------------------------"

read -p "Do you want to continue? (y/n): " -n 1 -r
echo    # Move to new line

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

echo "Resetting to commit: $COMMIT_HASH"
git reset --soft "$COMMIT_HASH"

echo "Amending with message: $COMMIT_MESSAGE"
git commit --amend -m "$COMMIT_MESSAGE"

echo "✅ Done! Single commit created successfully."