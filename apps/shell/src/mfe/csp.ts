/**
 * The shell's Content-Security-Policy in production. It's built at deploy time, once the discovery
 * origins are known: the page only runs code from the shell and the federated remotes, and only
 * connects to the remotes and the API the catalog and details query. If an HTML fragment brought a
 * script or an attribute like onerror, the browser wouldn't run it.
 */
export interface CspSources {
  /** Origins of the Module Federation remotes: their code runs inside the page. */
  federated: readonly string[];
  /** Origins of every remote: the shell requests manifests and fragments from them. */
  remotes: readonly string[];
  /** Base64 sha256 of each inline script in index.html. */
  inlineScripts: readonly string[];
}

/** APIs the browser queries directly, because the catalog and details are CSR. */
export const BROWSER_APIS = ["https://api.tvmaze.com"];

export function contentSecurityPolicy({ federated, remotes, inlineScripts }: CspSources): string {
  const directives: Record<string, readonly string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", ...federated, ...inlineScripts.map((hash) => `'sha256-${hash}'`)],
    "connect-src": ["'self'", ...remotes, ...BROWSER_APIS],
    // The remotes bring their CSS as <style> and React uses inline styles.
    "style-src": ["'self'", "'unsafe-inline'", ...federated, "https://fonts.googleapis.com"],
    "font-src": ["https://fonts.gstatic.com"],
    // Posters, team badges and cast photos come from the APIs, always over https.
    "img-src": ["'self'", "data:", "https:"],
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "form-action": ["'none'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${[...new Set(values)].join(" ")}`)
    .join("; ");
}
