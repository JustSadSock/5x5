#!/usr/bin/env bash
set -euo pipefail

TARGET=${1:-index.html}
if [[ ! -f "$TARGET" ]]; then
  echo "[netlify-inject] File not found: $TARGET" >&2
  exit 1
fi

node <<'NODE' "$TARGET"
const fs = require('fs');
const path = process.argv[1];
const api = process.env.CROSSLINE_API_URL || '';
const ws = process.env.CROSSLINE_WS_URL || '';
if (!api && !ws) {
  console.log('[netlify-inject] No CROSSLINE_* variables set, skipping.');
  process.exit(0);
}
const placeholder = '<!-- CROSSLINE_RUNTIME_ENV -->';
const html = fs.readFileSync(path, 'utf8');
const assignments = [];
if (api) assignments.push(`window.CROSSLINE_API_URL=${JSON.stringify(api)};`);
if (ws) assignments.push(`window.CROSSLINE_WS_URL=${JSON.stringify(ws)};`);
const snippet = `<script>(function(){${assignments.join('')}})();</script>`;
let output;
if (html.includes(placeholder)) {
  output = html.replace(placeholder, `${snippet}\n  ${placeholder}`);
} else {
  output = html.replace(/<head>/i, `<head>\n  ${snippet}`);
}
fs.writeFileSync(path, output);
console.log('[netlify-inject] Injected runtime config into', path);
NODE
