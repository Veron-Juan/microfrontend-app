import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

/**
 * Compila una hoja de Tailwind desde Node, para los remotes que no usan Vite (SSR y SSG).
 * Hace lo mismo que el plugin de Vite: lee el CSS de entrada, busca clases en los archivos de
 * la app (desde la carpeta del CSS hacia abajo, salvo lo ignorado por git) y genera solo esas.
 */
export async function compileTailwind(entry: string, { minify = true } = {}): Promise<string> {
  const from = resolve(entry);
  const base = dirname(from);
  const compiler = await compile(await readFile(from, "utf8"), { base, onDependency: () => undefined });
  const root =
    compiler.root === "none"
      ? []
      : compiler.root === null
        ? [{ base, pattern: "**/*", negated: false }]
        : [{ ...compiler.root, negated: false }];
  const scanner = new Scanner({ sources: [...root, ...compiler.sources] });
  const css = compiler.build(scanner.scan());
  return optimize(css, { minify }).code;
}
