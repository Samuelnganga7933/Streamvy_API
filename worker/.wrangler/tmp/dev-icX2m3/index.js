var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-7TwF1T/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.js
var MEDIA_REFERER = "https://moviebox.ph/";
var MEDIA_ORIGIN = "https://moviebox.ph";
var MEDIA_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var ALLOWED_HOST_SUFFIXES = [
  "hakunaymatata.com",
  "aoneroom.com",
  "moviebox.ph",
  "akamaized.net",
  "cloudfront.net",
  "fastly.net"
];
var CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS",
  "access-control-allow-headers": "Range, If-Range, If-None-Match, If-Modified-Since",
  "access-control-expose-headers": "Content-Length, Content-Range, Accept-Ranges, Content-Disposition, ETag, Last-Modified",
  "access-control-max-age": "86400"
};
var PASS_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
  "cache-control"
];
function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...CORS_HEADERS
    }
  });
}
__name(json, "json");
function allowedHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost"))
    return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host))
    return false;
  if (host === "[::1]")
    return false;
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}
__name(allowedHost, "allowedHost");
function safeFilename(value, target) {
  const raw = (value || "").trim();
  const candidate = raw || decodeURIComponent(new URL(target).pathname.split("/").pop() || "") || "download";
  const cleaned = candidate.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").replace(/\s+/g, " ").trim();
  return cleaned || "download";
}
__name(safeFilename, "safeFilename");
async function relay(request, url) {
  const target = url.searchParams.get("url");
  if (!target)
    return json({ detail: "Missing url parameter" }, 400);
  let upstreamUrl;
  try {
    upstreamUrl = new URL(target);
  } catch {
    return json({ detail: "Invalid url parameter" }, 400);
  }
  if (upstreamUrl.protocol !== "https:") {
    return json({ detail: "Only https media URLs are allowed" }, 400);
  }
  if (!allowedHost(upstreamUrl.hostname)) {
    return json({ detail: "Media host is not allowed" }, 400);
  }
  const headers = new Headers({
    Referer: MEDIA_REFERER,
    Origin: MEDIA_ORIGIN,
    "User-Agent": MEDIA_USER_AGENT,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9"
  });
  for (const name of [
    "range",
    "if-range",
    "if-none-match",
    "if-modified-since"
  ]) {
    const value = request.headers.get(name);
    if (value)
      headers.set(name, value);
  }
  let upstream;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers,
      redirect: "follow"
    });
  } catch (error) {
    return json(
      { detail: `Upstream fetch failed: ${error?.message || "unknown error"}` },
      502
    );
  }
  if (!upstream.ok && upstream.status !== 206) {
    const text = await upstream.text().catch(() => "");
    return json(
      {
        detail: `Upstream error ${upstream.status}: ${text.slice(0, 200) || upstream.statusText}`
      },
      502
    );
  }
  const responseHeaders = new Headers(CORS_HEADERS);
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value)
      responseHeaders.set(name, value);
  }
  if (url.pathname === "/proxy/download") {
    const filename = safeFilename(url.searchParams.get("filename"), target);
    responseHeaders.set(
      "content-disposition",
      `attachment; filename="${filename}"`
    );
  }
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}
__name(relay, "relay");
var src_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ detail: "Method not allowed" }, 405);
    }
    if (url.pathname === "/health") {
      return json({ ok: true, transport: "cloudflare-worker" }, 200);
    }
    if (url.pathname !== "/proxy/stream" && url.pathname !== "/proxy/download") {
      return json({ detail: "Not found" }, 404);
    }
    return relay(request, url);
  }
};

// ../../../../../../private/tmp/npm-cache/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../private/tmp/npm-cache/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-7TwF1T/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../../private/tmp/npm-cache/_npx/0eedb5afd4158ff3/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-7TwF1T/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
