#!/usr/bin/env bash

# Abyss tvOS theme - docker init script
# for use with linuxserver/jellyfin via custom-cont-init.d
#
# place at: config/custom-cont-init.d/abyss-spotlight.sh
# make executable: chmod +x config/custom-cont-init.d/abyss-spotlight.sh
# mount in compose: ./config/custom-cont-init.d:/custom-cont-init.d:ro

set -euo pipefail

REPO="Skirmantas-SK/jellyfin-apple-tv"
BRANCH="main"
WEB_DIR="/usr/share/jellyfin/web"
UI_DIR="${WEB_DIR}/ui"

RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
STAGE_DIR="/tmp/abyss-stage"
BRANDING_FILE="/config/config/branding.xml"
CUSTOM_CSS="@import url('/web/ui/abyss.css');"

THEME_FILES=(
    "abyss.css"
    "scripts/spotlight/spotlight.html"
    "scripts/spotlight/spotlight.css"
    "scripts/spotlight/home-html.chunk.js"
)

log() { echo "**** [abyss-tvos] $* ****"; }

download_theme_files() {
    rm -rf "$STAGE_DIR"
    mkdir -p "$STAGE_DIR"

    for file in "${THEME_FILES[@]}"; do
        dest="${STAGE_DIR}/$(basename "$file")"
        if curl -fsSL "${RAW}/${file}" -o "$dest"; then
            log "Downloaded: $(basename "$file")"
        else
            log "ERROR: Failed to download ${file} - check REPO, BRANCH, and network access"
            rm -rf "$STAGE_DIR"
            exit 1
        fi
    done
}

install_ui_files() {
    mkdir -p "$UI_DIR"

    for f in abyss.css spotlight.html spotlight.css; do
        src="${STAGE_DIR}/${f}"
        dest="${UI_DIR}/${f}"

        if ! cmp -s "$src" "$dest" 2>/dev/null; then
            cp -f "$src" "$dest"
            log "Updated: /web/ui/${f}"
        else
            log "Unchanged: /web/ui/${f}"
        fi
    done
}

patch_branding_css_with_python() {
    BRANDING_FILE="$BRANDING_FILE" CUSTOM_CSS="$CUSTOM_CSS" python3 <<'PY'
import os
import xml.etree.ElementTree as ET
from pathlib import Path

path = Path(os.environ["BRANDING_FILE"])
css = os.environ["CUSTOM_CSS"]
path.parent.mkdir(parents=True, exist_ok=True)

if path.exists() and path.stat().st_size:
    try:
        tree = ET.parse(path)
        root = tree.getroot()
    except ET.ParseError:
        root = ET.Element("BrandingOptions")
        tree = ET.ElementTree(root)
else:
    root = ET.Element("BrandingOptions")
    tree = ET.ElementTree(root)

def local_name(tag):
    return tag.rsplit("}", 1)[-1]

custom_css = None
for child in list(root):
    if local_name(child.tag) == "CustomCss":
        custom_css = child
        break

if custom_css is None:
    namespace = root.tag[1:].split("}", 1)[0] if root.tag.startswith("{") else ""
    tag = f"{{{namespace}}}CustomCss" if namespace else "CustomCss"
    custom_css = ET.SubElement(root, tag)

custom_css.text = css

try:
    ET.indent(tree, space="  ")
except AttributeError:
    pass

tree.write(path, encoding="utf-8", xml_declaration=True)
PY
}

patch_branding_css_with_awk() {
    mkdir -p "$(dirname "$BRANDING_FILE")"

    if [ ! -s "$BRANDING_FILE" ]; then
        {
            printf '%s\n' '<?xml version="1.0" encoding="utf-8"?>'
            printf '%s\n' '<BrandingOptions>'
            printf '  <CustomCss>%s</CustomCss>\n' "$CUSTOM_CSS"
            printf '%s\n' '</BrandingOptions>'
        } > "$BRANDING_FILE"
        return
    fi

    tmp_file="$(mktemp)"

    if grep -q "<CustomCss" "$BRANDING_FILE"; then
        awk -v css="$CUSTOM_CSS" '
            /<CustomCss>.*<\/CustomCss>/ {
                sub(/<CustomCss>.*<\/CustomCss>/, "<CustomCss>" css "</CustomCss>")
                print
                next
            }
            /<CustomCss[[:space:]]*\/>/ {
                sub(/<CustomCss[[:space:]]*\/>/, "<CustomCss>" css "</CustomCss>")
                print
                next
            }
            /<CustomCss>/ {
                print "  <CustomCss>" css "</CustomCss>"
                in_custom_css = 1
                next
            }
            /<\/CustomCss>/ {
                in_custom_css = 0
                next
            }
            in_custom_css { next }
            { print }
        ' "$BRANDING_FILE" > "$tmp_file"
    else
        awk -v css="$CUSTOM_CSS" '
            /<\/BrandingOptions>/ && inserted == 0 {
                print "  <CustomCss>" css "</CustomCss>"
                inserted = 1
            }
            { print }
            END {
                if (inserted == 0) {
                    print "<CustomCss>" css "</CustomCss>"
                }
            }
        ' "$BRANDING_FILE" > "$tmp_file"
    fi

    mv "$tmp_file" "$BRANDING_FILE"
}

patch_branding_css() {
    if command -v python3 >/dev/null 2>&1; then
        patch_branding_css_with_python
    else
        patch_branding_css_with_awk
    fi

    log "Branding CustomCss set to local /web/ui/abyss.css import"
}

patch_home_chunk() {
    CHUNK_FILE="$(find "$WEB_DIR" -maxdepth 1 -name "home-html.*.chunk.js" | head -n 1)"

    if [ -z "$CHUNK_FILE" ]; then
        log "WARNING: Could not find home-html.*.chunk.js - skipping chunk patch"
        return
    fi

    log "Found chunk: $(basename "$CHUNK_FILE")"

    if [ ! -f "${CHUNK_FILE}.bak" ]; then
        cp -f "$CHUNK_FILE" "${CHUNK_FILE}.bak"
        log "Backup created: $(basename "$CHUNK_FILE").bak"
    else
        log "Backup already exists: $(basename "$CHUNK_FILE").bak"
    fi

    if ! cmp -s "${STAGE_DIR}/home-html.chunk.js" "$CHUNK_FILE" 2>/dev/null; then
        cp -f "${STAGE_DIR}/home-html.chunk.js" "$CHUNK_FILE"
        log "Chunk patched"
    else
        log "Chunk already current"
    fi
}

cleanup() {
    rm -rf "$STAGE_DIR"
}

trap cleanup EXIT

log "Applying Abyss tvOS theme"

if [ ! -d "$WEB_DIR" ]; then
    log "ERROR: Web directory not found at ${WEB_DIR}"
    log "If using a non-linuxserver image, set WEB_DIR to your web directory path"
    exit 1
fi

download_theme_files
install_ui_files
patch_branding_css
patch_home_chunk

log "Abyss tvOS theme applied successfully"
