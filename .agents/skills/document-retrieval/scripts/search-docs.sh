#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  search-docs.sh [--pdf] [--context N] <query> [paths...]

Examples:
  search-docs.sh '鼻炎犯了怎么办'
  search-docs.sh 'questionsKnowledge' acp-gateway/src
  search-docs.sh --pdf --context 1 '血糖' docs questions
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

search_pdf=false
context=2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pdf)
      search_pdf=true
      shift
      ;;
    --context)
      context="${2:-}"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "[search-docs] Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 1
fi

query="$1"
shift

default_roots=(questions docs pages acp-gateway)
roots=()

if [[ $# -gt 0 ]]; then
  for path in "$@"; do
    [[ -e "$path" ]] && roots+=("$path")
  done
else
  for path in "${default_roots[@]}"; do
    [[ -e "$path" ]] && roots+=("$path")
  done
fi

if [[ ${#roots[@]} -eq 0 ]]; then
  echo "[search-docs] No valid paths to search." >&2
  exit 1
fi

if ! command -v rg >/dev/null 2>&1; then
  echo "[search-docs] rg is required for this script." >&2
  exit 1
fi

echo "[search-docs] query: $query"
echo "[search-docs] roots: ${roots[*]}"
echo

echo "== File Matches =="
rg --files \
  -g '!**/node_modules/**' \
  -g '!**/dist/**' \
  -g '!**/.git/**' \
  "${roots[@]}" \
  2>/dev/null | rg -n -S -- "$query" || true
echo

echo "== Content Matches =="
rg -n -C "$context" --hidden -S \
  -g '!**/node_modules/**' \
  -g '!**/dist/**' \
  -g '!**/.git/**' \
  -g '!**/*.png' \
  -g '!**/*.jpg' \
  -g '!**/*.jpeg' \
  -g '!**/*.gif' \
  -g '!**/*.webp' \
  -g '!**/*.svg' \
  -- "$query" "${roots[@]}" \
  || true

if [[ "$search_pdf" != true ]]; then
  exit 0
fi

echo
echo "== PDF Matches =="

if ! command -v pdftotext >/dev/null 2>&1; then
  echo "[search-docs] pdftotext not found; skipping PDF search."
  exit 0
fi

while IFS= read -r pdf; do
  match_count="$(pdftotext "$pdf" - 2>/dev/null | rg -n -S -- "$query" | sed -n '1,5p' || true)"
  if [[ -n "$match_count" ]]; then
    echo "-- $pdf --"
    printf '%s\n' "$match_count"
    echo
  fi
done < <(find "${roots[@]}" -type f -name '*.pdf' 2>/dev/null)
