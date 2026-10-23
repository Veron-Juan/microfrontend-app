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

/** Reads the shared dependency registry from the Module Federation runtime (React only). */
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
  // The registry changes when a federated remote loads: subscribing to its status makes it get read again.
  useStore((s) => `${s.loads.catalog?.status}:${s.loads.details?.status}`);
  const shared = readSharedReact();

  return (
    <Lesson id="shared-deps" title="Shared dependencies" kicker="A single React for everyone, negotiated at runtime.">
      <Prose>
        <p>
          If each remote brought its own React, the user would download the library three times and hooks would break
          when mixed. That's why the shell and the remotes declare React as a <b>shared singleton</b>: the Module
          Federation runtime picks a compatible version and everyone uses that same instance.
        </p>
      </Prose>
      <Table>
        <thead>
          <tr>
            <th>Package</th>
            <th>Version</th>
            <th>Provided by</th>
            <th>Loaded</th>
          </tr>
        </thead>
        <tbody>
          {shared.length > 0 ? (
            shared.map((share) => (
              <tr key={`${share.pkg}${share.version}${share.from}`}>
                <td className="font-mono text-[0.86em]">{share.pkg}</td>
                <td className="font-mono text-[0.86em]">{share.version}</td>
                <td>{share.from}</td>
                <td className="font-mono text-[0.86em]">{share.loaded ? "yes, in use" : "registered"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-muted">
                Reading the Module Federation registry…
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      <Note>
        Read live from <code>__FEDERATION__.__SHARE__</code>. Catalog and details also declare React, but the runtime
        hands them the copy the shell already loaded: React is downloaded only once.
      </Note>
      <Cards columns="three">
        <Card title="singleton">
          A single instance across the whole page. Essential for React, routers and libraries with global state.
        </Card>
        <Card title="requiredVersion">
          Each app states which range it accepts (^18.3.1). If there's no compatible version, the runtime warns.
        </Card>
        <Card title="The cost">
          Sharing couples: upgrading React requires coordinating every team. Share as little as possible.
        </Card>
      </Cards>
    </Lesson>
  );
}
