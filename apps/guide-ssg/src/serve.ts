import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

// Un servidor de archivos mínimo que se comporta como un CDN: no ejecuta código por request,
// solo entrega lo que generó el build, con ETag y caché.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const PORT = Number(process.env.PORT ?? 5004);
const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".json": "application/json" };
const meta: { builtAt?: string; version?: string } = JSON.parse(await readFile(join(ROOT, "build.json"), "utf8").catch(() => "{}"));

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(ROOT, path === "" ? "index.html" : path);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Expose-Headers": "ETag, Last-Modified, X-Render-Mode, X-Built-At, X-App-Version, Age, Cache-Control",
  };
  try {
    if (!file.startsWith(ROOT)) throw new Error("fuera de dist");
    const [body, info] = await Promise.all([readFile(file), stat(file)]);
    const etag = '"' + createHash("sha1").update(body).digest("hex").slice(0, 12) + '"';
    Object.assign(headers, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      ETag: etag,
      "Last-Modified": info.mtime.toUTCString(),
      "X-Render-Mode": "SSG",
      "X-Built-At": meta.builtAt ?? "",
      "X-App-Version": meta.version ?? "",
      Age: String(Math.max(0, Math.round((Date.now() - info.mtimeMs) / 1000))),
    });
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, headers).end();
      return;
    }
    res.writeHead(200, headers).end(body);
  } catch {
    res.writeHead(404, { ...headers, "Content-Type": "text/plain" }).end("no existe");
  }
}).listen(PORT, () => console.log(`guide-ssg (SSG) sirviendo dist/ en http://localhost:${PORT}`));
