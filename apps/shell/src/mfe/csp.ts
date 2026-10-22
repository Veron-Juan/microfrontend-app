/**
 * La Content-Security-Policy del shell en producción. Se arma en el deploy, cuando ya se conocen los
 * orígenes del discovery: la página solo ejecuta código del shell y de los remotes federados, y solo
 * se conecta a los remotes y a la API que consultan el catálogo y la ficha. Si un fragmento HTML
 * trajera un script o un atributo como onerror, el navegador no lo ejecutaría.
 */
export interface CspSources {
  /** Orígenes de los remotes de Module Federation: su código corre dentro de la página. */
  federated: readonly string[];
  /** Orígenes de todos los remotes: el shell les pide manifiestos y fragmentos. */
  remotes: readonly string[];
  /** sha256 en base64 de cada script inline de index.html. */
  inlineScripts: readonly string[];
}

/** APIs que el navegador consulta directo, porque el catálogo y la ficha son CSR. */
export const BROWSER_APIS = ["https://api.tvmaze.com"];

export function contentSecurityPolicy({ federated, remotes, inlineScripts }: CspSources): string {
  const directives: Record<string, readonly string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", ...federated, ...inlineScripts.map((hash) => `'sha256-${hash}'`)],
    "connect-src": ["'self'", ...remotes, ...BROWSER_APIS],
    // Los remotes traen su CSS como <style> y React usa estilos en línea.
    "style-src": ["'self'", "'unsafe-inline'", ...federated, "https://fonts.googleapis.com"],
    "font-src": ["https://fonts.gstatic.com"],
    // Carátulas, escudos y fotos del elenco vienen de las APIs, siempre por https.
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
