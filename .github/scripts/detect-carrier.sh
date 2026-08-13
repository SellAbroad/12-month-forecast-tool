#!/usr/bin/env bash
# EtherHiding carrier detector: fake-font/.vscode autorun + config/source whitespace payload.
# Runs post-checkout in CI; scans the resulting tree. Exit 1 on any HIGH finding. bash 3.2 + macOS safe.
set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
FOUND="$(mktemp)"
EXCL='(^|/)(node_modules|dist|build|\.next|\.astro|\.output|coverage|vendor)/|\.min\.(js|mjs|cjs)$|(^|/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|(^|/)(detect-carrier\.sh|detect-obfuscation\.sh|security-scan-allowlist\.txt)$|(^|/)documentation/'
{ git ls-files 2>/dev/null || find . -type f | sed 's|^\./||'; } | grep -vE "$EXCL" | while IFS= read -r f; do
  [ -f "$f" ] || continue
  case "$f" in
    *.woff2|*.woff|*.ttf|*.otf|*.eot)
      # A real font is binary. Flag a TEXT font file only on malware-specific signals
      # (node exec tokens) OR the whitespace-hider run. Do NOT match bare function/=>,
      # they appear in benign HTML-saved-as-a-font broken assets (false positives).
      if grep -Iq . "$f" 2>/dev/null && { \
           grep -Eq 'require\(|eval\(|global\[|child_process|spawn|createRequire' "$f" 2>/dev/null \
           || LC_ALL=C awk 'BEGIN{sp=sprintf("%80s","")} index($0,sp){found=1; exit} END{exit !found}' "$f" 2>/dev/null; }; then
        echo "[HIGH] fake-font (exec/whitespace payload in a font file): $f" >>"$FOUND"
      fi ;;
  esac
  case "$f" in
    .vscode/tasks.json|*/.vscode/tasks.json)
      grep -q 'folderOpen' "$f" 2>/dev/null && grep -Eq 'node |where node|command -v node|\.woff|\.ttf|/fonts/|curl |wget |base64 |bash |powershell' "$f" 2>/dev/null && echo "[HIGH] .vscode folderOpen task executes code: $f" >>"$FOUND" ;;
    .vscode/settings.json|*/.vscode/settings.json)
      grep -Eq '"task\.allowAutomaticTasks"[[:space:]]*:[[:space:]]*true' "$f" 2>/dev/null && echo "[HIGH] .vscode allowAutomaticTasks:true: $f" >>"$FOUND" ;;
  esac
  case "$f" in
    *.js|*.mjs|*.cjs|*.ts|*.tsx|*.jsx|*.vue|*.astro)
      LC_ALL=C awk 'BEGIN{sp=sprintf("%80s","")} length>=500 && index($0,sp){f=1; exit} END{exit !f}' "$f" 2>/dev/null && echo "[HIGH] whitespace-hidden payload (long line + 80-space run): $f" >>"$FOUND" ;;
  esac
done
if [ -s "$FOUND" ]; then echo "RESULT: FAIL"; sort -u "$FOUND"; rm -f "$FOUND"; exit 1; else echo "RESULT: PASS"; rm -f "$FOUND"; exit 0; fi
