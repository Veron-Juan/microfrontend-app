// Lógica del servidor estático, separada de la red para poder probarla: resolver rutas,
// calcular ETags y armar las cabeceras de un CDN.
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

/** Cinco minutos frescos y, después, un día en que el CDN puede servirlo mientras revalida. */
export const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=86400";

/** Las cabeceras que no dependen del archivo: CORS, caché y las de diagnóstico de la lección. */
export function buildHeaders(meta: BuildMeta): Record<string, string> {
  return {
    ...CORS_HEADERS,
    // Sin esto, el navegador oculta los tamaños y tiempos de una respuesta de otro origen y el shell
    // no puede saber si la respondió su caché.
    "Timing-Allow-Origin": "*",
    "Cache-Control": CACHE_CONTROL,
    "X-Render-Mode": "SSG",
    "X-Built-At": meta.builtAt ?? "",
    "X-App-Version": meta.version ?? "",
  };
}

/**
 * El archivo `_headers` de Cloudflare Pages y Netlify, con las mismas cabeceras para todo el sitio.
 * ETag, Last-Modified y Age no van: esas las calcula el propio CDN.
 */
export function headersFile(meta: BuildMeta): string {
  const lines = Object.entries(buildHeaders(meta))
    .filter(([, value]) => value !== "")
    .map(([name, value]) => `  ${name}: ${value}`);
  return ["/*", ...lines, ""].join("\n");
}

/**
 * Traduce la ruta de la URL a un archivo dentro de `root`. Devuelve null si la ruta es inválida
 * o intenta salir de la carpeta (p. ej. con "../").
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

/** ETag fuerte a partir del contenido: cambia solo si cambian los bytes. */
export function etagOf(body: Uint8Array): string {
  return `"${createHash("sha1").update(body).digest("hex").slice(0, 12)}"`;
}

/** Si la copia que ya tiene el cliente (If-None-Match) sigue siendo válida. */
export function isNotModified(ifNoneMatch: string | undefined, etag: string): boolean {
  if (!ifNoneMatch) return false;
  if (ifNoneMatch.trim() === "*") return true;
  return ifNoneMatch.split(",").some((tag) => tag.trim().replace(/^W\//, "") === etag);
}

function send(res: ServerResponse, status: number, headers: Record<string, string>, body?: string | Uint8Array) {
  res.writeHead(status, headers).end(body);
}

/** Un servidor de archivos que se comporta como un CDN: no ejecuta código por request. */
export function createStaticHandler(root: string, meta: BuildMeta): RequestListener {
  return async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, { ...CORS_HEADERS, Allow: "GET, HEAD", "Content-Type": "text/plain" }, "método no permitido");
      return;
    }
    const file = resolveFile(root, new URL(req.url ?? "/", "http://localhost").pathname);
    const notFound = () => send(res, 404, { ...CORS_HEADERS, "Content-Type": "text/plain" }, "no existe");
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
      console.error("guide-ssg: error al leer", file, error);
      send(res, 500, { ...CORS_HEADERS, "Content-Type": "text/plain" }, "error del servidor");
    }
  };
}
