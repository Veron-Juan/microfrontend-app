import assert from "node:assert/strict";
import { test } from "node:test";
import { contentSecurityPolicy } from "./csp.ts";

const policy = contentSecurityPolicy({
  federated: ["https://catalog.example.com"],
  remotes: ["https://catalog.example.com", "https://news.example.com"],
  inlineScripts: ["abc="],
});
const directive = (name: string) => policy.split("; ").find((part) => part.startsWith(`${name} `));

test("only runs scripts from the shell, the federated remotes and inline ones by hash", () => {
  assert.equal(directive("script-src"), "script-src 'self' https://catalog.example.com 'sha256-abc='");
  assert.ok(!policy.includes("unsafe-eval"));
});

test("connects to the remotes and the browser API, and cannot be framed", () => {
  assert.equal(
    directive("connect-src"),
    "connect-src 'self' https://catalog.example.com https://news.example.com https://api.tvmaze.com",
  );
  assert.equal(directive("frame-ancestors"), "frame-ancestors 'none'");
  assert.equal(directive("object-src"), "object-src 'none'");
});
