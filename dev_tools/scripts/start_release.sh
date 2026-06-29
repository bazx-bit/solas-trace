#!/bin/bash
# solas-trace/scripts/start_release.sh
#
# This script manages semantic versioning for Solas Trace releases:
# 1. Creates a new release branch `vX.Y` from origin/main.
# 2. Generates the corresponding tags (`vX.Y.Z`) and pushes them.
# 3. Creates an official GitHub Release with auto-generated changelogs.
#

set -e

VERSION=$1
BASE_REF=${2:-origin/main}

if [[ $# -lt 1 || $# -gt 2 ]]; then
    echo
    echo "Usage: ./scripts/start_release.sh <VERSION> [BASE_REF]"
    echo
    echo "  VERSION:         The version to release: 'vX.Y' or 'vX.Y.Z'"
    echo "  BASE_REF:        (optional) Commit/branch to base the release on."
    echo "                   Defaults to origin/main."
    echo
    exit 1
fi

# Validate Solas Trace version format
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
    echo "❌ Error: Version must follow semantic format 'vX.Y' or 'vX.Y.Z' (got $VERSION)"
    false
fi

IS_PATCH=0
if [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    IS_PATCH=1
    MAJOR_MINOR=$(echo "${VERSION}" | awk -F. '{print $1 "." $2}')
    PATCH_NUM=$(echo "${VERSION}" | awk -F. '{print $3}')
    PREV_VERSION=$(echo ${VERSION} | awk -F. -v OFS=. '{$NF -= 1 ; print}')
    if [[ -n "$PREV_VERSION" ]]; then
        NOTES_ARG="--notes-start-tag ${PREV_VERSION}"
    else
        NOTES_ARG=""
    fi
else
    MAJOR_MINOR="$VERSION"
    if [[ "$VERSION" =~ ^v[0-9]+\.0$ ]]; then
        PREV_PREFIX=$(echo ${VERSION} | awk -F. '{print "v" substr($1, 2) - 1}')
        PREV_VERSION=$(git tag -l | grep -E $PREV_PREFIX | grep -E "^v[0-9]+\.[0-9]+\.[0-9]+$" | sort -V | tail -n 1)
    else
        PREV_VERSION=$(echo ${VERSION} | awk -F. -v OFS=. '{$NF -= 1 ; print}').0
    fi
    if [[ -n "$PREV_VERSION" ]]; then
        NOTES_ARG="--notes-start-tag ${PREV_VERSION}"
    else
        NOTES_ARG=""
    fi
fi

if [[ $IS_PATCH -eq 1 && $# -lt 2 ]]; then
    BASE_REF="origin/main"
fi

# Ensure gh CLI is present
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is required to generate release notes. Install from https://cli.github.com/"
    false
fi

# Validate GitHub CLI version
GH_VERSION=$(gh --version | perl -pe 'if(($v)=/([0-9]+([.][0-9]+)+)/){print"$v\n";exit}$_=""')
if ! { echo "2.28.0"; echo "$GH_VERSION"; } | sort -V -C; then
    echo "❌ GitHub CLI is outdated ($GH_VERSION). Please upgrade to >= 2.28.0"
    false
fi

# Prepare Git State
echo "🔄 Fetching latest from origin..."
git fetch origin
git checkout $BASE_REF

git log -1
if [[ $IS_PATCH -eq 1 ]]; then
    BRANCH=${MAJOR_MINOR}
else
    BRANCH=${VERSION}
fi

echo
if [[ $IS_PATCH -eq 1 ]]; then
    echo "🚀 Creating Solas Trace Patch Release '${VERSION}' on '${BASE_REF}'"
else
    echo "🚀 Creating Solas Trace Minor Release '${BRANCH}' on '${BASE_REF}'"
fi
echo

# Execute Branch & Tagging
if [[ $IS_PATCH -eq 1 ]]; then
    TAG=${VERSION}
    if git rev-parse "$TAG" >/dev/null 2>&1 || git ls-remote --tags origin | grep -q "refs/tags/$TAG$"; then
        echo "⚠️ Tag $TAG already exists. Aborting patch release."
        false
    fi
    git tag $TAG
    git push origin $TAG
else
    TAG=${VERSION}.0
    if git rev-parse "$TAG" >/dev/null 2>&1 || git ls-remote --tags origin | grep -q "refs/tags/$TAG$"; then
        echo "⚠️ Tag $TAG already exists. Aborting minor release."
        false
    fi
    git checkout -b $BRANCH
    git push origin $BRANCH
    git tag $TAG
    git push origin $TAG
fi

# Trigger GitHub Release
echo "📦 Generating GitHub Release for Solas Trace..."
gh release create $TAG --verify-tag --generate-notes --title "Solas Trace $TAG" $NOTES_ARG

echo "✅ Successfully published Solas Trace release $TAG!"
