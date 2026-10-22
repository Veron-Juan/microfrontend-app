// Genera el remotes.json de un entorno y lo valida con el mismo parser que usa el shell al arrancar:
// si queda mal, falla el deploy y no el navegador de un visitante. Se corre después de `vite build`:
//
//   MFE_ENVIRONMENT=production \
//   MFE_NEWS_ORIGIN=https://news.example.com MFE_CATALOG_ORIGIN=https://catalog.example.com \
//   MFE_DETAILS_ORIGIN=https://details.example.com MFE_GUIDE_ORIGIN=https://guide.example.com \
//   npm run discovery -w shell
//
// Parte del remotes.json local (public/remotes.json): conserva rutas, tipos y metadata, cambia el
// origen de cada remote y toma su versión del package.json. Con equipos en repos separados, cada
// pipeline actualizaría solo su entrada en un servicio de discovery; aquí todo vive junto.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseDiscovery } from "../src/mfe/discovery.ts";

const root = new URL("../../../", import.meta.url);
const local = JSON.parse(await readFile(new URL("apps/shell/public/remotes.json", root), "utf8")) as {
  microFrontends: Record<string, { url: string; version: string; metadata: { name: string } }>;
};

const problems: string[] = [];
const microFrontends: Record<string, unknown> = {};
for (const [id, entry] of Object.entries(local.microFrontends)) {
  const variable = `MFE_${id.toUpperCase()}_ORIGIN`;
  const origin = process.env[variable];
  if (!origin) {
    problems.push(`falta ${variable}`);
    continue;
  }
  if (!/^https:\/\//.test(origin) && !/^http:\/\/localhost[:/]/.test(origin)) {
    problems.push(`${variable} debe ser https (o localhost): ${origin}`);
    continue;
  }
  const { pathname } = new URL(entry.url);
  const pkg = JSON.parse(await readFile(new URL(`apps/${entry.metadata.name}/package.json`, root), "utf8")) as {
    version: string;
  };
  microFrontends[id] = { ...entry, url: new URL(pathname, origin).href, version: pkg.version };
}
if (problems.length > 0) throw new Error(`discovery:\n- ${problems.join("\n- ")}`);

const discovery = { environment: process.env.MFE_ENVIRONMENT ?? "production", microFrontends };
// La misma validación que hace el shell en el navegador.
parseDiscovery(discovery, "https://shell.invalid/");

const out = new URL(process.argv[2] ?? "apps/shell/dist/remotes.json", root);
await writeFile(out, `${JSON.stringify(discovery, null, 2)}\n`);
console.info(`discovery (${discovery.environment}) → ${fileURLToPath(out)}`);
for (const [id, entry] of Object.entries(discovery.microFrontends) as [string, { url: string; version: string }][]) {
  console.info(`  ${id.padEnd(8)} ${entry.version.padEnd(7)} ${entry.url}`);
}
