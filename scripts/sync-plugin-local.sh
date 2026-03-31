#!/usr/bin/env bash
# Sync WordPress plugin to Local (utrecht-demo). Override with ORG_CATALOG_PLUGIN_SRC / ORG_CATALOG_PLUGIN_DEST.
set -euo pipefail
SRC="${ORG_CATALOG_PLUGIN_SRC:-/Users/victorvanderhulst/Projects/organization-catalog/wordpress-plugin/fides-organization-catalog/}"
DEST="${ORG_CATALOG_PLUGIN_DEST:-/Users/victorvanderhulst/Local Sites/utrecht-demo/app/public/wp-content/plugins/fides-organization-catalog/}"
rsync -av --delete "$SRC" "$DEST"
