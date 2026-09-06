#!/bin/sh
# GitHub Pages can only serve a branch's root or its /docs folder — not an
# arbitrary directory — so docs/ is a build output, not a place to edit.
#
#   customer/  ->  docs/          (the public registration site, Pages root)
#   staff/     ->  docs/staff/    (assets the Apps Script console pulls in)
#
# Run this after changing anything under customer/ or staff/, then commit both.
set -e
cd "$(dirname "$0")"

rm -rf docs
mkdir -p docs/staff

cp -r customer/. docs/
cp -r staff/. docs/staff/

echo "docs/ rebuilt from customer/ and staff/"
