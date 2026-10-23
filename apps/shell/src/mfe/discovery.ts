import type { RenderMode } from "@mfe/contracts";

/*
 * The discovery document: where each micro-frontend lives in an environment.
 *
 * The shell doesn't compile in the remotes' URLs: it reads them from /remotes.json at startup. In
 * production that file is served by a service or a CDN, and each remote's pipeline updates its entry
 * when it deploys a new version. That way a remote ships to production (or rolls back) without
 * touching the shell. The shape is inspired by AWS's Frontend Discovery Service, an open spec.
 */

export type RemoteType = "module-federation" | "fragment";

export interface DiscoveredRemote {
  type: RemoteType;
  /** mf-manifest.json for Module Federation; the HTML's URL for a fragment. */
  url: string;
  /** Exposed module ("./Catalog"). Module Federation only. */
  module?: string;
  version: string;
  /** What the remote's pipeline publishes about itself. The shell only displays it. */
  metadata: { name: string; team: string; render: RenderMode };
}

export interface Discovery {
  environment: string;
  microFrontends: Record<string, DiscoveredRemote>;
}

const RENDER_MODES: readonly string[] = ["CSR", "SSR", "SSG"];
const TYPES: readonly string[] = ["module-federation", "fragment"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validates the discovery JSON. It comes from the network and another system writes it: better to
 * fail at startup with a clear message than halfway through with an "undefined is not a function".
 * Relative URLs are resolved against `base` (the file's own URL).
 */
export function parseDiscovery(json: unknown, base: string): Discovery {
  if (!isRecord(json) || typeof json.environment !== "string" || !isRecord(json.microFrontends)) {
    throw new Error("discovery: expected { environment, microFrontends }");
  }
  const microFrontends: Record<string, DiscoveredRemote> = {};
  for (const [id, entry] of Object.entries(json.microFrontends)) {
    const problem = (detail: string) => new Error(`discovery: "${id}" ${detail}`);
    if (!isRecord(entry)) throw problem("is not an object");
    const { type, url, module, version, metadata } = entry;
    if (typeof type !== "string" || !TYPES.includes(type)) throw problem(`has an invalid type (${String(type)})`);
    if (typeof url !== "string") throw problem("has no url");
    if (typeof version !== "string") throw problem("has no version");
    if (type === "module-federation" && (typeof module !== "string" || !module.startsWith("./"))) {
      throw problem('needs "module", for example "./Catalog"');
    }
    if (!isRecord(metadata) || typeof metadata.name !== "string" || typeof metadata.team !== "string") {
      throw problem("needs metadata.name and metadata.team");
    }
    if (typeof metadata.render !== "string" || !RENDER_MODES.includes(metadata.render)) {
      throw problem("needs metadata.render: CSR, SSR or SSG");
    }
    microFrontends[id] = {
      type: type as RemoteType,
      url: new URL(url, base).href,
      module: typeof module === "string" ? module : undefined,
      version,
      metadata: { name: metadata.name, team: metadata.team, render: metadata.render as RenderMode },
    };
  }
  return { environment: json.environment, microFrontends };
}

/** Downloads and validates the current environment's discovery. */
export async function fetchDiscovery(url: string): Promise<Discovery> {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`discovery: HTTP ${response.status} fetching ${url}`);
  return parseDiscovery(await response.json(), response.url || url);
}
