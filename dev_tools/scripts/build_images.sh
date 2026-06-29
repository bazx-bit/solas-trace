#!/bin/bash
# solas-trace/scripts/build_images.sh
#
# Trigger Solas Trace Docker image builds via GitHub Actions.
# Builds the unified Rust backend and Vite frontend images.
# Requires: gh CLI (https://cli.github.com/) installed and authenticated.
#
# Usage:
#   ./scripts/build_images.sh <BRANCH_OR_TAG>
#
set -euo pipefail

BRANCH=${1:-}

if [ -z "$BRANCH" ]; then
  echo
  echo "Usage: ./scripts/build_images.sh <BRANCH>"
  echo
  echo "  BRANCH: Git branch, tag, or SHA to build images from."
  echo "          The branch must be pushed to the remote."
  echo
  echo "Examples:"
  echo "  ./scripts/build_images.sh main"
  echo "  ./scripts/build_images.sh feat/rca-engine"
  echo
  exit 1
fi

# Ensure GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Install it: https://cli.github.com/"
  if [[ "${OSTYPE:-}" == darwin* ]]; then
    echo "  brew install gh"
  fi
  exit 1
fi

# Ensure Authentication
if ! gh auth status &> /dev/null; then
  echo "Error: GitHub CLI is not authenticated. Run: gh auth login"
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

echo "🚀 Triggering Solas Trace Docker image builds..."
echo "  Repo:   $REPO"
echo "  Target: $BRANCH"
echo

# Trigger the remote workflow
gh workflow run docker-build.yml \
  --ref main \
  -f branch_ref="$BRANCH"

echo
echo "✅ Build triggered successfully!"
echo
echo "Monitor progress:"
echo "  https://github.com/$REPO/actions/workflows/docker-build.yml"
echo
echo "Or via CLI:"
echo "  gh run list --workflow=docker-build.yml --limit=5"
echo
