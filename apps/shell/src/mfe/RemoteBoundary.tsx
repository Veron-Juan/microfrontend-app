import { Component, type ReactNode } from "react";
import { markLoad } from "../state/store.ts";
import { errorMessage } from "../lib/errors.ts";
import { Fallback } from "./Fallback.tsx";
import type { RemoteApp } from "./registry.ts";

interface Props {
  app: RemoteApp;
  children: ReactNode;
}

/**
 * Atrapa los errores que lanza un remote al renderizar. Sin esto, un bug en el catálogo
 * desmontaría toda la página del shell; con esto, solo su espacio muestra el aviso.
 */
export class RemoteBoundary extends Component<Props, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    markLoad(this.props.app.id, { status: "error", error: errorMessage(error) });
  }

  render() {
    return this.state.error ? <Fallback app={this.props.app} error={this.state.error} /> : this.props.children;
  }
}
