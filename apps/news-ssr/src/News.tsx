/** @jsxRuntime automatic */
// Componente React que solo se ejecuta en el servidor. El navegador recibe HTML ya armado.
// (El pragma de arriba fija el runtime de JSX aunque tsx no vea este tsconfig, p. ej. en los tests.)
import type { Score } from "./live-data.ts";

export interface NewsProps {
  rendered: string;
  requestId: string;
  served: number;
  scores: Score[];
  headlines: string[];
  timing: { data: number; render: number };
}

export function News({ rendered, requestId, served, scores, headlines, timing }: NewsProps) {
  return (
    <section className="nws:grid nws:gap-3.5 nws:font-sans" data-request={requestId}>
      <header className="nws:flex nws:flex-wrap nws:items-baseline nws:justify-between nws:gap-3">
        <h3 className="nws:m-0 nws:text-[15px] nws:font-semibold nws:text-strong">Novedades en vivo</h3>
        <span className="nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-muted">
          renderizado en el servidor a las <b className="nws:font-medium nws:text-ssr">{rendered}</b>
        </span>
      </header>
      <div className="nws:grid nws:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] nws:gap-4.5 nws:max-sm:grid-cols-1">
        <ul className="nws:m-0 nws:grid nws:list-none nws:gap-1.5 nws:p-0">
          {scores.map((match) => (
            <li
              key={match.home}
              className="nws:grid nws:grid-cols-[34px_1fr_auto_1fr] nws:items-center nws:gap-2 nws:rounded-lg nws:border nws:border-faint nws:px-2.5 nws:py-2 nws:text-[13px] nws:text-text"
            >
              <span className="nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-ssr">{`${match.minute}'`}</span>
              <span>{match.home}</span>
              <b className="nws:font-mono nws:text-[14px] nws:leading-[normal] nws:font-semibold nws:text-strong nws:tabular-nums">
                {`${match.goals[0]} – ${match.goals[1]}`}
              </b>
              <span className="nws:text-right">{match.away}</span>
            </li>
          ))}
        </ul>
        <ol className="nws:m-0 nws:grid nws:list-none nws:gap-1.5 nws:p-0 nws:[counter-reset:n]">
          {headlines.map((line) => (
            <li
              key={line}
              className="nws:relative nws:pl-6.5 nws:font-serif nws:text-[15px] nws:leading-[1.35] nws:text-strong nws:[counter-increment:n] nws:before:absolute nws:before:top-0.75 nws:before:left-0 nws:before:font-mono nws:before:text-[10px] nws:before:leading-[normal] nws:before:text-muted nws:before:content-[counter(n,decimal-leading-zero)]"
            >
              {line}
            </li>
          ))}
        </ol>
      </div>
      <footer className="nws:flex nws:flex-wrap nws:gap-4 nws:font-mono nws:text-[11px] nws:leading-[normal] nws:text-muted">
        <span>
          request <code className="nws:font-mono nws:text-text">{requestId}</code>
        </span>
        <span>request nº {served} de este servidor</span>
        <span>API de marcadores {timing.data} ms</span>
      </footer>
    </section>
  );
}
