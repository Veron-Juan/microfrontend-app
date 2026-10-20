import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDiscovery } from "./discovery.ts";

const BASE = "https://shell.example.com/remotes.json";
const catalog = {
  type: "module-federation",
  url: "https://catalog.example.com/mf-manifest.json",
  module: "./Catalog",
  version: "1.4.0",
  metadata: { name: "catalog", team: "Descubrimiento", render: "CSR" },
};

test("lee un remote de Module Federation", () => {
  const discovery = parseDiscovery({ environment: "prod", microFrontends: { catalog } }, BASE);
  assert.equal(discovery.environment, "prod");
  assert.deepEqual(discovery.microFrontends.catalog, catalog);
});

test("resuelve URLs relativas contra la ubicación del archivo", () => {
  const guide = { ...catalog, type: "fragment", module: undefined, url: "guide/fragment.html" };
  const discovery = parseDiscovery({ environment: "preview", microFrontends: { guide } }, BASE);
  assert.equal(discovery.microFrontends.guide?.url, "https://shell.example.com/guide/fragment.html");
});

test("rechaza entradas incompletas con un mensaje que dice cuál", () => {
  const broken = { ...catalog, module: undefined };
  assert.throws(
    () => parseDiscovery({ environment: "prod", microFrontends: { catalog: broken } }, BASE),
    /"catalog".*module/,
  );
  const badRender = { ...catalog, metadata: { ...catalog.metadata, render: "ISR" } };
  assert.throws(() => parseDiscovery({ environment: "prod", microFrontends: { catalog: badRender } }, BASE), /render/);
  assert.throws(() => parseDiscovery({ microFrontends: {} }, BASE), /environment/);
});
