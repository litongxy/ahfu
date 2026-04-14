#!/bin/bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ACCOUNT_ID="${CF_ACCOUNT_ID:-08455f061c565358efc304496c49b328}"
WORKER_NAME="${CF_WORKER_NAME:-ahfu}"
ENV_NAME="${CF_ENV_NAME:-production}"
COMPATIBILITY_DATE="${CF_COMPATIBILITY_DATE:-$(date +%F)}"
CF_DOMAIN="${CF_DOMAIN:-}"
CF_ROUTE_PATTERN="${CF_ROUTE_PATTERN:-}"
CF_API_ORIGIN="${CF_API_ORIGIN:-https://doctor.lo.mytool.zone}"
CF_ENABLE_WORKERS_DEV="${CF_ENABLE_WORKERS_DEV:-true}"
CF_API_TOKEN="${CLOUDFLARE_API_TOKEN:-${CF_API_TOKEN:-}}"

if [[ -z "$CF_API_TOKEN" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN (or CF_API_TOKEN)."
  echo "Example:"
  echo "  CLOUDFLARE_API_TOKEN=your_token ./scripts/deploy-cloudflare-worker.sh"
  exit 1
fi

if [[ -z "$CF_ROUTE_PATTERN" && -n "$CF_DOMAIN" ]]; then
  CF_ROUTE_PATTERN="${CF_DOMAIN}/*"
fi

assert_success() {
  local response="$1"
  if ! printf '%s' "$response" | jq -e '.success == true' >/dev/null 2>&1; then
    printf '%s\n' "$response" | jq .
    return 1
  fi
}

json_query() {
  local response="$1"
  local filter="$2"
  printf '%s' "$response" | jq -r "$filter"
}

resolve_zone_for_domain() {
  local full_domain="$1"
  local response
  local zone_id
  local zone_name
  local labels
  local count
  local i
  local candidate

  IFS='.' read -r -a labels <<< "$full_domain"
  count="${#labels[@]}"

  if [[ "$count" -lt 2 ]]; then
    return 1
  fi

  for ((i=0; i<=count-2; i++)); do
    candidate="$(IFS='.'; echo "${labels[*]:i}")"
    response="$(
      curl -sS -G "https://api.cloudflare.com/client/v4/zones" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        --data-urlencode "name=${candidate}" \
        --data-urlencode "status=active" \
        --data-urlencode "per_page=1"
    )"

    assert_success "$response" >/dev/null
    zone_id="$(json_query "$response" '.result[0].id // empty')"
    zone_name="$(json_query "$response" '.result[0].name // empty')"

    if [[ -n "$zone_id" && -n "$zone_name" && "$zone_name" == "$candidate" ]]; then
      echo "${zone_id}|${zone_name}"
      return 0
    fi
  done

  return 1
}

echo "Building worker bundle..."
node "$REPO_ROOT/scripts/build-cloudflare-worker.mjs"

METADATA="$(printf '{"main_module":"worker.generated.mjs","compatibility_date":"%s","bindings":[{"name":"API_ORIGIN","type":"plain_text","text":"%s"}]}' "$COMPATIBILITY_DATE" "$CF_API_ORIGIN")"

echo "Deploying worker ${WORKER_NAME}..."
DEPLOY_RESPONSE="$(
  curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/services/${WORKER_NAME}/environments/${ENV_NAME}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -F "metadata=${METADATA};type=application/json" \
    -F "worker.generated.mjs=@${REPO_ROOT}/cloudflare/worker.generated.mjs;type=application/javascript+module"
)"

if ! assert_success "$DEPLOY_RESPONSE" >/dev/null; then
  echo "Service environment endpoint failed, retrying legacy script endpoint..."
  DEPLOY_RESPONSE="$(
    curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -F "metadata=${METADATA};type=application/json" \
      -F "worker.generated.mjs=@${REPO_ROOT}/cloudflare/worker.generated.mjs;type=application/javascript+module"
  )"
fi

assert_success "$DEPLOY_RESPONSE" >/dev/null
echo "Worker uploaded."

WORKERS_DEV_URL=""
if [[ "$CF_ENABLE_WORKERS_DEV" == "true" ]]; then
  echo "Enabling workers.dev subdomain..."
  SUBDOMAIN_ENABLE_RESPONSE="$(
    curl -sS -X POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER_NAME}/subdomain" \
      -H "Authorization: Bearer ${CF_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"enabled":true}'
  )"

  assert_success "$SUBDOMAIN_ENABLE_RESPONSE" >/dev/null

  ACCOUNT_SUBDOMAIN_RESPONSE="$(
    curl -sS "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/subdomain" \
      -H "Authorization: Bearer ${CF_API_TOKEN}"
  )"

  if assert_success "$ACCOUNT_SUBDOMAIN_RESPONSE" >/dev/null; then
    ACCOUNT_SUBDOMAIN="$(json_query "$ACCOUNT_SUBDOMAIN_RESPONSE" '.result.subdomain // empty')"
    if [[ -n "$ACCOUNT_SUBDOMAIN" ]]; then
      WORKERS_DEV_URL="https://${WORKER_NAME}.${ACCOUNT_SUBDOMAIN}.workers.dev"
    fi
  fi
fi

if [[ -n "$CF_DOMAIN" ]]; then
  echo "Resolving zone for ${CF_DOMAIN}..."
  ZONE_RESOLVED="$(resolve_zone_for_domain "$CF_DOMAIN" || true)"
  ZONE_ID="${ZONE_RESOLVED%%|*}"
  ZONE_NAME="${ZONE_RESOLVED#*|}"

  if [[ -z "$ZONE_ID" || -z "$ZONE_NAME" || "$ZONE_ID" == "$ZONE_RESOLVED" ]]; then
    echo "Failed to resolve zone id for domain ${CF_DOMAIN}. Please check Zone Read permission and domain ownership."
    exit 1
  fi
  echo "Zone id: ${ZONE_ID} (zone: ${ZONE_NAME})"

  echo "Checking existing Worker routes..."
  ROUTES_RESPONSE="$(
    curl -sS "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
      -H "Authorization: Bearer ${CF_API_TOKEN}"
  )"
  assert_success "$ROUTES_RESPONSE" >/dev/null

  EXISTING_ROUTE_ID="$(json_query "$ROUTES_RESPONSE" ".result[]? | select(.pattern == \"${CF_ROUTE_PATTERN}\") | .id" | head -n 1)"
  ROUTE_PAYLOAD="$(printf '{"pattern":"%s","script":"%s"}' "$CF_ROUTE_PATTERN" "$WORKER_NAME")"

  if [[ -n "$EXISTING_ROUTE_ID" ]]; then
    echo "Updating existing route ${CF_ROUTE_PATTERN}..."
    ROUTE_RESPONSE="$(
      curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes/${EXISTING_ROUTE_ID}" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "$ROUTE_PAYLOAD"
    )"
  else
    echo "Creating route ${CF_ROUTE_PATTERN}..."
    ROUTE_RESPONSE="$(
      curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "$ROUTE_PAYLOAD"
    )"
  fi

  assert_success "$ROUTE_RESPONSE" >/dev/null
fi

echo
echo "Deploy success."
echo "Worker: ${WORKER_NAME}"
echo "Env: ${ENV_NAME}"
echo "API_ORIGIN: ${CF_API_ORIGIN}"
if [[ -n "$WORKERS_DEV_URL" ]]; then
  echo "workers.dev: ${WORKERS_DEV_URL}"
  echo "Chat page: ${WORKERS_DEV_URL}/chat.html"
  echo "Health: ${WORKERS_DEV_URL}/health"
fi
if [[ -n "$CF_ROUTE_PATTERN" ]]; then
  echo "Route: ${CF_ROUTE_PATTERN}"
fi
