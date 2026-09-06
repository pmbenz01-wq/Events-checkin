#!/bin/sh
# GitHub Pages can only serve a branch's root or its /docs folder — not an
# arbitrary directory — so docs/ is a build output, not a place to edit.
#
#   customer/  ->  docs/   (the public registration site, Pages root)
#
# Run this after changing anything under customer/, then commit both.
set -e
cd "$(dirname "$0")"

rm -rf docs
mkdir -p docs
cp -r customer/. docs/

echo "docs/ rebuilt from customer/"
