/// <reference types="vite/client" />

// Constantes que Vite inyecta en el build (ver `define` en vite.config.ts).
declare const __URLS__: { shell: string; catalog: string; player: string; news: string; guide: string };
declare const __PREVIEW__: boolean;

// Registro de dependencias compartidas que expone el runtime de Module Federation.
interface FederationShareInfo {
  from?: string;
  loaded?: boolean;
  lib?: unknown;
  useIn?: string[];
}
type FederationShareScope = Record<string, Record<string, Record<string, Record<string, FederationShareInfo>>>>;
// eslint-disable-next-line no-var
declare var __FEDERATION__: { __SHARE__?: FederationShareScope } | undefined;
