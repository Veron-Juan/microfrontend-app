/// <reference types="vite/client" />

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
