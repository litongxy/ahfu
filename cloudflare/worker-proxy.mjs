const DEFAULT_ORIGIN_BASE_URL = "https://doctor.lo.mytool.zone";

function normalizeOrigin(rawOrigin) {
  const fallback = DEFAULT_ORIGIN_BASE_URL;
  const candidate = String(rawOrigin || fallback).trim() || fallback;
  return candidate.replace(/\/+$/, "");
}

function buildUpstreamUrl(requestUrl, originBaseUrl) {
  const incoming = new URL(requestUrl);
  return `${originBaseUrl}${incoming.pathname}${incoming.search}`;
}

export default {
  async fetch(request, env) {
    const originBaseUrl = normalizeOrigin(env.ORIGIN_BASE_URL);
    const upstreamUrl = buildUpstreamUrl(request.url, originBaseUrl);

    if (new URL(request.url).pathname === "/__edge-health") {
      return Response.json({
        status: "ok",
        edge: "cloudflare-worker",
        upstream: originBaseUrl,
        now: new Date().toISOString(),
      });
    }

    const headers = new Headers(request.headers);
    headers.set("x-forwarded-proto", "https");
    headers.set("x-forwarded-host", new URL(request.url).host);

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    });

    const upstreamResponse = await fetch(upstreamRequest);
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("x-proxy-by", "ahfu-cloudflare-worker");
    responseHeaders.set("x-proxy-upstream", originBaseUrl);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
