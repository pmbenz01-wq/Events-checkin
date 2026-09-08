#!/bin/sh
# GitHub Pages can only serve a branch's root or its /docs folder — not an
# arbitrary directory — so docs/ is a build output, not a place to edit.
#
#   customer/  ->  docs/   (the public registration site, Pages root)
#
# Run this after changing anything under customer/, then commit both.
set -e
cd "$(dirname "$0")"

# docs/ also holds hand-written design docs (docs/adr, docs/superpowers) that
# have no customer/ counterpart, so clear only the mirrored entries — a blanket
# `rm -rf docs` deletes them, and they are not recoverable from customer/.
mkdir -p docs
(cd customer && ls -A) | while IFS= read -r name; do
  rm -rf "docs/$name"
done
cp -r customer/. docs/

echo "docs/ rebuilt from customer/"
