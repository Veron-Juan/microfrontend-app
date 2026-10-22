import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSecurityPolicy } from "./csp.ts";

const policy = contentSecurityPolicy({
  federated: ["https://catalog.example.com"],
  remotes: ["https://catalog.example.com", "https://news.example.com"],
  inlineScripts: ["abc="],
});
const directive = (name: string) => policy.split("; ").find((part) => part.startsWith(`${name} `));

test("solo ejecuta scripts del shell, de los remotes federados y los inline con su hash", () => {
  assert.equal(directive("script-src"), "script-src 'self' https://catalog.example.com 'sha256-abc='");
  assert.ok(!policy.includes("unsafe-eval"));
});

test("se conecta a los remotes y a la API del navegador, y no se puede enmarcar", () => {
  assert.equal(
    directive("connect-src"),
    "connect-src 'self' https://catalog.example.com https://news.example.com https://api.tvmaze.com",
  );
  assert.equal(directive("frame-ancestors"), "frame-ancestors 'none'");
  assert.equal(directive("object-src"), "object-src 'none'");
});
