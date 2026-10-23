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
  metadata: { name: "x", team: "Team", render },
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

test("matches the discovery against the layout's slots", () => {
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
  assert.equal(apps.find((app) => app.id === "guide")?.composition, "Static HTML fragment");
});

test("fails if the discovery is missing a remote the layout needs", () => {
  const microFrontends = { ...discovery.microFrontends };
  delete microFrontends.guide;
  assert.throws(() => buildRegistry({ ...discovery, microFrontends }, "https://shell.example.com/"), /missing guide/);
});
