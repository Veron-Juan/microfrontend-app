// The static server's logic, kept apart from the network so it can be tested: resolving paths,
// computing ETags and building a CDN's headers.
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";

export const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
};

export const CORS_HEADERS: Readonly<Record<string, string>> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "ETag, Last-Modified, X-Render-Mode, X-Built-At, X-App-Version, Cache-Control",
};

export interface BuildMeta {
  builtAt?: string;
  version?: string;
}

/** Five minutes fresh and, after that, a day in which the CDN can serve it while revalidating. */
export const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

/** The headers that don't depend on the file: CORS, caching and the lesson's diagnostic headers. */
export function buildHeaders(meta: BuildMeta): Record<string, string> {
  return {
    ...CORS_HEADERS,
    // Without this, the browser hides the sizes and timings of a cross-origin response and the shell
    // can't tell whether its cache answered it.
    "Timing-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": CACHE_CONTROL,
    "X-Render-Mode": "SSG",
    "X-Built-At": meta.builtAt ?? "",
    "X-App-Version": meta.version ?? "",
  };
}

/**
 * The `_headers` file for Cloudflare Pages and Netlify, with the same headers for the whole site.
 * ETag, Last-Modified and Age aren't included: the CDN computes those itself.
 */
export function headersFile(meta: BuildMeta): string {
  const lines = Object.entries(buildHeaders(meta))
    .filter(([, value]) => value !== "")
    .map(([name, value]) => `  ${name}: ${value}`);
  return ["/*", ...lines, ""].join("\n");
}

/**
 * Maps the URL path to a file inside `root`. Returns null if the path is invalid or tries to leave
 * the folder (e.g. with "../").
 */
export function resolveFile(root: string, urlPath: string): string | null {
  let path: string;
  try {
    path = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (path.includes("\0")) return null;
  if (path === "" || path.endsWith("/")) path += "index.html";
  const base = resolve(root);
  const file = join(base, path);
  const inside = relative(base, file);
  if (inside === "" || inside.startsWith("..") || isAbsolute(inside)) return null;
  return file;
}

export function contentTypeOf(file: string): string {
  return CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
}

/** A strong ETag from the content: it only changes if the bytes change. */
export function etagOf(body: Uint8Array): string {
  return `"${createHash("sha1").update(body).digest("hex").slice(0, 12)}"`;
}

/** Whether the copy the client already has (If-None-Match) is still valid. */
export function isNotModified(ifNoneMatch: string | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false;
  if (ifNoneMatch.trim() === "*") return true;
  return ifNoneMatch.split(",").some((tag) => tag.trim().replace(/^W\//, "") === etag);
}

function send(res: ServerResponse, status: number, headers: Record<string, string>, body?: string | Uint8Array) {
  res.writeHead(status, headers).end(body);
}

/** A file server that behaves like a CDN: it runs no code per request. */
export function createStaticHandler(root: string, meta: BuildMeta): RequestListener {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, { ...CORS_HEADERS, Allow: "GET, HEAD", "Content-Type": "text/plain" }, "method not allowed");
      return;
    }
    const file = resolveFile(root, new URL(req.url ?? "/", "http://localhost").pathname);
    const notFound = () => send(res, 404, { ...CORS_HEADERS, "Content-Type": "text/plain" }, "not found");
    if (file === null) {
      notFound();
      return;
    }
    try {
      const [body, info] = await Promise.all([readFile(file), stat(file)]);
      const etag = etagOf(body);
      const headers = {
        ...buildHeaders(meta),
        "Content-Type": contentTypeOf(file),
        ETag: etag,
        "Last-Modified": info.mtime.toUTCString(),
      };
      if (isNotModified(req.headers["if-none-match"], etag)) {
        send(res, 304, headers);
        return;
      }
      send(res, 200, headers, req.method === "HEAD" ? undefined : body);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" || code === "EISDIR" || code === "ENOTDIR") {
        notFound();
        return;
      }
      console.error("guide-ssg: error reading", file, error);
      send(res, 500, { ...CORS_HEADERS, "Content-Type": "text/plain" }, "server error");
    }
  };
}
