import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";

/**
 * Compiles a Tailwind stylesheet from Node, for the remotes that don't use Vite (SSR and SSG).
 * It does the same as the Vite plugin: reads the entry CSS, scans the app's files for classes
 * (from the CSS's folder down, except what git ignores) and generates only those.
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
