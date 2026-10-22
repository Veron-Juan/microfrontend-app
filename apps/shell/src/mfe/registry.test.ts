import assert from "node:assert/strict";
import { test } from "node:test";
import type { Discovery } from "./discovery.ts";
import { buildRegistry } from "./registry.ts";

const remote = (
  type: "module-federation" | "fragment",
  render: "CSR" | "SSR" | "SSG",
  url: string,
  module?: string,
) => ({
  type,
  url,
  module,
  version: "1.0.0",
  metadata: { name: "x", team: "Equipo", render },
});

const discovery: Discovery = {
  environment: "test",
  microFrontends: {
    news: remote("fragment", "SSR", "https://news.example.com/fragment/news"),
    catalog: remote("module-federation", "CSR", "https://catalog.example.com/mf-manifest.json", "./Catalog"),
    details: remote("module-federation", "CSR", "https://details.example.com/mf-manifest.json", "./Details"),
    guide: remote("fragment", "SSG", "https://cdn.example.com/guide/fragment/guide.html"),
  },
};

test("cruza el discovery con los lugares del layout", () => {
  const { apps } = buildRegistry(discovery, "https://shell.example.com/");
  assert.deepEqual(
    apps.map((app) => [app.id, app.kind]),
    [
      ["shell", "host"],
      ["news", "fragment"],
      ["catalog", "federated"],
      ["details", "federated"],
      ["guide", "fragment"],
    ],
  );
  const catalog = apps.find((app) => app.id === "catalog");
  assert.equal(catalog?.kind === "federated" && catalog.expose, "Catalog");
  assert.equal(apps.find((app) => app.id === "guide")?.composition, "Fragmento HTML estático");
});

test("falla si al discovery le falta un remote que el layout necesita", () => {
  const microFrontends = { ...discovery.microFrontends };
  delete microFrontends.guide;
  assert.throws(() => buildRegistry({ ...discovery, microFrontends }, "https://shell.example.com/"), /faltan guide/);
});
