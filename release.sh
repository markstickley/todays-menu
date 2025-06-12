#!/bin/bash

# This script builds and pushes Docker images for the Today's Menu application, and adds a github tag for the specified version.
# It requires a version argument to tag the image appropriately.
# It is intended to be run from the root of the repository.
# It should not be run in a container, but rather on a host machine with Docker installed.

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"

docker build -t markstickley/todays-menu:latest --platform linux/amd64 .
docker build -t markstickley/todays-menu:"$VERSION" --platform linux/amd64 .
docker push markstickley/todays-menu:latest
docker push markstickley/todays-menu:"$VERSION"

# Add a git tag for the version
git tag -a "$VERSION" -m "Release version $VERSION"
git push origin "$VERSION"