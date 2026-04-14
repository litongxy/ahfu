#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const outputDir = path.join(repoRoot, "cloudflare");
const outputFile = path.join(outputDir, "worker.generated.mjs");

const staticFiles = [
  { source: "chat.html", route: "/chat.html", type: "text/html; charset=utf-8", aliases: ["/", "/chat"] },
  { source: "styles/common.css", route: "/styles/common.css", type: "text/css; charset=utf-8" },
  { source: "scripts/auth-client.js", route: "/scripts/auth-client.js", type: "application/javascript; charset=utf-8" },
  { source: "data/recipes.js", route: "/data/recipes.js", type: "application/javascript; charset=utf-8" },
  { source: "pages/login/index.html", route: "/pages/login/index.html", type: "text/html; charset=utf-8", aliases: ["/login", "/pages/login"] },
  { source: "pages/health-profile/index.html", route: "/pages/health-profile/index.html", type: "text/html; charset=utf-8", aliases: ["/health-profile", "/pages/health-profile"] },
  { source: "pages/profile/index.html", route: "/pages/profile/index.html", type: "text/html; charset=utf-8", aliases: ["/profile", "/pages/profile"] },
  { source: "pages/recipe/list.html", route: "/pages/recipe/list.html", type: "text/html; charset=utf-8", aliases: ["/recipe", "/pages/recipe", "/recipe/list"] },
  { source: "pages/exercise/list.html", route: "/pages/exercise/list.html", type: "text/html; charset=utf-8", aliases: ["/exercise", "/pages/exercise", "/exercise/list"] },
  { source: "pages/report-analysis/index.html", route: "/pages/report-analysis/index.html", type: "text/html; charset=utf-8", aliases: ["/report-analysis", "/pages/report-analysis"] },
];

const assetMapEntries = [];
const aliasEntries = [];

for (const file of staticFiles) {
  const absolutePath = path.join(repoRoot, file.source);
  const body = fs.readFileSync(absolutePath, "utf8");
  assetMapEntries.push([file.route, { type: file.type, body }]);

  for (const alias of file.aliases || []) {
    aliasEntries.push([alias, file.route]);
  }
}

const workerSource = `const ASSETS = new Map(${JSON.stringify(assetMapEntries)});
const ROUTE_ALIASES = new Map(${JSON.stringify(aliasEntries)});

function normalizePathname(pathname) {
  if (!pathname || pathname === "") return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function resolveAssetPath(pathname) {
  const normalized = normalizePathname(pathname);

  if (ASSETS.has(normalized)) {
    return normalized;
  }

  const aliasPath = ROUTE_ALIASES.get(normalized);
  if (aliasPath && ASSETS.has(aliasPath)) {
    return aliasPath;
  }

  if (!normalized.includes(".")) {
    const htmlPath = normalized + ".html";
    if (ASSETS.has(htmlPath)) return htmlPath;

    const indexPath = normalized + "/index.html";
    if (ASSETS.has(indexPath)) return indexPath;

    const pageIndexPath = "/pages" + normalized + "/index.html";
    if (ASSETS.has(pageIndexPath)) return pageIndexPath;
  }

  return null;
}

function getApiOrigin(env) {
  const raw = (env && typeof env.API_ORIGIN === "string" ? env.API_ORIGIN : "").trim();
  if (!raw) return "";
  return raw.replace(/\\/+$/, "");
}

async function proxyAcpRequest(request, apiOrigin) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(apiOrigin + requestUrl.pathname + requestUrl.search);

  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", requestUrl.host);
  headers.set("x-forwarded-proto", requestUrl.protocol.replace(":", ""));

  const clientIp = request.headers.get("cf-connecting-ip");
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
  }

  headers.delete("host");

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set("x-ahfu-worker", "proxy");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;

    if (pathname.startsWith("/acp")) {
      const apiOrigin = getApiOrigin(env);
      if (!apiOrigin) {
        return new Response("Missing API_ORIGIN binding.", { status: 500 });
      }
      return proxyAcpRequest(request, apiOrigin);
    }

    if (pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "ahfu-worker",
        timestamp: new Date().toISOString(),
      });
    }

    const assetPath = resolveAssetPath(pathname);
    if (!assetPath) {
      return new Response("Not Found", { status: 404 });
    }

    const asset = ASSETS.get(assetPath);
    const headers = new Headers();
    headers.set("content-type", asset.type);
    headers.set("cache-control", assetPath.endsWith(".html") ? "no-store" : "public, max-age=3600");
    headers.set("x-ahfu-worker", "static");

    return new Response(asset.body, { status: 200, headers });
  },
};
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, workerSource, "utf8");

console.log(`Generated ${path.relative(repoRoot, outputFile)}`);
