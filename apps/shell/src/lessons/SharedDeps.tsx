import { useStore } from "../state/store.ts";
import { Card, Cards } from "../ui/Card.tsx";
import { Lesson, Note, Prose } from "../ui/Lesson.tsx";
import { Table } from "../ui/Table.tsx";

interface SharedPackage {
  pkg: string;
  version: string;
  from?: string;
  loaded: boolean;
}

/** Lee el registro de dependencias compartidas del runtime de Module Federation (solo React). */
function readSharedReact(): SharedPackage[] {
  const scopes = globalThis.__FEDERATION__?.__SHARE__ ?? {};
  const unique = new Map<string, SharedPackage>();
  for (const scope of Object.values(scopes)) {
    for (const packages of Object.values(scope)) {
      for (const [pkg, versions] of Object.entries(packages)) {
        if (!pkg.startsWith("react")) continue;
        for (const [version, info] of Object.entries(versions)) {
          unique.set(`${pkg}@${version}:${info.from}`, {
            pkg,
            version,
            from: info.from,
            loaded: Boolean(info.loaded ?? info.lib),
          });
        }
      }
    }
  }
  return [...unique.values()];
}

export function SharedDeps() {
  // El registro cambia cuando carga un remote federado: suscribirse a su estado hace que se vuelva a leer.
  useStore((s) => `${s.loads.catalog?.status}:${s.loads.player?.status}`);
  const shared = readSharedReact();

  return (
    <Lesson id="dependencias" title="Dependencias compartidas" kicker="Un solo React para todos, negociado en runtime.">
      <Prose>
        <p>
          Si cada remote trajera su propio React, el usuario descargaría la librería tres veces y los hooks fallarían al
          mezclarse. Por eso el shell y los remotes declaran React como <b>singleton compartido</b>: el runtime de
          Module Federation elige una versión compatible y todos usan esa misma instancia.
        </p>
      </Prose>
      <Table>
        <thead>
          <tr>
            <th>Paquete</th>
            <th>Versión</th>
            <th>La ofrece</th>
            <th>Cargada</th>
          </tr>
        </thead>
        <tbody>
          {shared.length > 0 ? (
            shared.map((share) => (
              <tr key={`${share.pkg}${share.version}${share.from}`}>
                <td className="font-mono text-[0.86em]">{share.pkg}</td>
                <td className="font-mono text-[0.86em]">{share.version}</td>
                <td>{share.from}</td>
                <td className="font-mono text-[0.86em]">{share.loaded ? "sí, en uso" : "registrada"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-muted">
                Leyendo el registro de Module Federation…
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      <Note>
        Leído en vivo de <code>__FEDERATION__.__SHARE__</code>. Catálogo y reproductor también declaran React, pero el
        runtime les entrega la copia que ya cargó el shell: React se descarga una sola vez.
      </Note>
      <Cards columns="three">
        <Card title="singleton">
          Una sola instancia en toda la página. Imprescindible para React, routers y librerías con estado global.
        </Card>
        <Card title="requiredVersion">
          Cada app dice qué rango acepta (^18.3.1). Si no hay una versión compatible, el runtime avisa.
        </Card>
        <Card title="El costo">
          Compartir acopla: subir React de versión exige coordinar a todos los equipos. Comparte lo mínimo.
        </Card>
      </Cards>
    </Lesson>
  );
}
