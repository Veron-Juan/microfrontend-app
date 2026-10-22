import { useEffect, useState, type ReactNode } from "react";
import { on, type RemoteMeta, type SelectDetail } from "@mfe/contracts";
import styles from "./details.css?inline";
import { formatRating, minutes, posterBackground, statusLabel, years } from "./format.ts";
import { TVMAZE_SITE, type CastMember, type ShowDetails } from "./tvmaze.ts";
import { useDetails, type DetailsStatus } from "./use-details.ts";

export const meta: RemoteMeta = { name: "details", version: "3.1.0", team: "Equipo Fichas", render: "CSR" };

const note = "dtl:font-mono dtl:text-[11px] dtl:leading-[normal] dtl:text-muted";
const caption =
  "dtl:m-0 dtl:font-mono dtl:text-[10px] dtl:leading-[normal] dtl:tracking-[.08em] dtl:text-muted dtl:uppercase";
const skeleton =
  "dtl:animate-shimmer dtl:rounded-md dtl:bg-linear-90 dtl:from-faint/60 dtl:via-faint dtl:to-faint/60 dtl:bg-size-[200%_100%]";

export default function Details() {
  const [show, setShow] = useState<SelectDetail | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const { details, status, ms } = useDetails(show?.tvmazeId);

  // La ficha solo conoce el contrato del evento, no al emisor.
  useEffect(() => {
    return on("mfe:select", (detail) => {
      setShow(detail);
      setLatency(Date.now() - detail.at);
    });
  }, []);

  return (
    <section className="dtl:grid dtl:h-full dtl:grid-rows-[auto_1fr_auto] dtl:gap-3.5 dtl:font-sans">
      {/* El CSS compilado viaja dentro del módulo remoto: funciona igual en el shell y en standalone. */}
      <style>{styles}</style>
      <header className="dtl:flex dtl:min-h-8 dtl:flex-wrap dtl:items-center dtl:justify-between dtl:gap-x-3 dtl:gap-y-1">
        <h3 className="dtl:m-0 dtl:text-[15px] dtl:font-semibold dtl:tracking-[-.01em] dtl:text-strong">Ficha</h3>
        <span className={note}>escucha mfe:select</span>
      </header>
      {show ? (
        // La key reinicia la animación de entrada con cada título elegido.
        <ShowCard key={show.id} show={show} details={details} status={status} />
      ) : (
        <Empty />
      )}
      <p
        className={`dtl:m-0 dtl:flex dtl:flex-wrap dtl:gap-x-3 dtl:gap-y-1 dtl:border-t dtl:border-faint dtl:pt-3 ${note}`}
      >
        {show && (
          <span>
            mfe:select de "{show.from}" en {latency} ms
          </span>
        )}
        {show && status === "ready" && (
          <span>{ms === null ? "ficha desde la caché" : `TVmaze respondió en ${ms} ms`}</span>
        )}
        <span>
          datos:{" "}
          <a href={details?.url ?? TVMAZE_SITE} className="dtl:text-text dtl:underline dtl:underline-offset-2">
            TVmaze
          </a>
        </span>
      </p>
    </section>
  );
}

interface ShowCardProps {
  show: SelectDetail;
  details: ShowDetails | null;
  status: DetailsStatus;
}

/** La ficha: arriba lo que trajo el evento (se ve al instante) y debajo lo que se pidió a TVmaze. */
function ShowCard({ show, details, status }: ShowCardProps) {
  const background = posterBackground({ hue: show.hue, image: details?.image ?? show.image });
  const loading = status === "loading";
  return (
    <article aria-busy={loading} className="dtl:grid dtl:animate-rise dtl:content-start dtl:gap-4">
      <div className="dtl:relative dtl:isolate dtl:overflow-hidden dtl:rounded-xl dtl:border dtl:border-faint dtl:bg-page/60 dtl:p-3.5">
        {/* La carátula, agrandada y desenfocada, hace de fondo. */}
        <div
          aria-hidden="true"
          className="dtl:absolute dtl:-inset-6 dtl:-z-10 dtl:scale-110 dtl:opacity-35 dtl:blur-2xl dtl:saturate-150"
          style={{ background }}
        />
        <div className="dtl:grid dtl:grid-cols-[92px_minmax(0,1fr)] dtl:items-end dtl:gap-4">
          <div
            aria-hidden="true"
            className="dtl:aspect-[2/3] dtl:rounded-lg dtl:shadow-[0_12px_28px_-10px_rgb(0_0_0/.55)] dtl:ring-1 dtl:ring-black/10"
            style={{ background }}
          />
          <div className="dtl:grid dtl:min-w-0 dtl:gap-1.5 dtl:pb-0.5">
            <span className="dtl:flex dtl:flex-wrap dtl:gap-1.5">
              <Badge>{show.kind}</Badge>
              {details && <Badge strong>{statusLabel(details.status)}</Badge>}
            </span>
            <b className="dtl:font-serif dtl:text-[25px] dtl:leading-[1.05] dtl:font-semibold dtl:text-balance dtl:text-strong">
              {details?.name ?? show.title}
            </b>
            <span className="dtl:text-[12.5px] dtl:text-text">
              {[minutes(show.length), details?.network].filter(Boolean).join(" · ")}
            </span>
          </div>
        </div>
      </div>

      {show.tvmazeId === undefined ? (
        <p className={`dtl:m-0 dtl:rounded-lg dtl:border dtl:border-dashed dtl:border-faint dtl:p-3 ${note}`}>
          Es un título del catálogo de respaldo: no tiene ficha en TVmaze.
        </p>
      ) : status === "error" ? (
        <p className={`dtl:m-0 dtl:rounded-lg dtl:border dtl:border-dashed dtl:border-faint dtl:p-3 ${note}`}>
          TVmaze no respondió: solo están los datos que trajo el evento.
        </p>
      ) : (
        <>
          <dl className="dtl:m-0 dtl:grid dtl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.45fr)] dtl:gap-2">
            <Stat label="nota" loading={loading}>
              {details?.rating == null ? "—" : `★ ${formatRating(details.rating)}`}
            </Stat>
            <Stat label="temporadas" loading={loading}>
              {details?.seasons ?? "—"}
            </Stat>
            <Stat label="años" loading={loading}>
              {details ? years(details.premiered, details.ended) || "—" : "—"}
            </Stat>
          </dl>
          {loading ? (
            <div className="dtl:grid dtl:gap-2" aria-label="Cargando la ficha">
              <span className={`${skeleton} dtl:h-3`} />
              <span className={`${skeleton} dtl:h-3`} />
              <span className={`${skeleton} dtl:h-3 dtl:w-3/5`} />
            </div>
          ) : (
            details?.summary && (
              <p lang="en" className="dtl:m-0 dtl:line-clamp-4 dtl:text-[13px] dtl:leading-relaxed dtl:text-text">
                {details.summary}
              </p>
            )
          )}
          {details && details.cast.length > 0 && (
            <div className="dtl:grid dtl:gap-2">
              <p className={caption}>Elenco</p>
              <ul className="dtl:m-0 dtl:grid dtl:list-none dtl:grid-cols-2 dtl:gap-x-3 dtl:gap-y-2.5 dtl:p-0">
                {details.cast.map((member) => (
                  <CastItem key={member.person} member={member} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function Badge({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      className={`dtl:rounded-full dtl:px-2 dtl:py-0.5 dtl:text-[11px] dtl:leading-[normal] dtl:font-medium ${strong ? "dtl:bg-strong dtl:text-card" : "dtl:bg-card/80 dtl:text-text dtl:ring-1 dtl:ring-faint"}`}
    >
      {children}
    </span>
  );
}

function Stat({ label, loading, children }: { label: string; loading: boolean; children: ReactNode }) {
  return (
    <div className="dtl:grid dtl:gap-1 dtl:rounded-lg dtl:border dtl:border-faint dtl:px-2.5 dtl:py-2">
      <dt className={caption}>{label}</dt>
      <dd className="dtl:m-0 dtl:text-[15px] dtl:leading-tight dtl:font-semibold dtl:whitespace-nowrap dtl:text-strong dtl:tabular-nums">
        {loading ? <span className={`${skeleton} dtl:block dtl:h-4 dtl:w-10`} /> : children}
      </dd>
    </div>
  );
}

function CastItem({ member }: { member: CastMember }) {
  return (
    <li className="dtl:grid dtl:min-w-0 dtl:grid-cols-[30px_minmax(0,1fr)] dtl:items-center dtl:gap-2.5">
      {member.image ? (
        <img
          src={member.image}
          alt=""
          loading="lazy"
          className="dtl:size-7.5 dtl:rounded-full dtl:object-cover dtl:ring-1 dtl:ring-faint"
        />
      ) : (
        <span
          aria-hidden="true"
          className="dtl:grid dtl:size-7.5 dtl:place-items-center dtl:rounded-full dtl:bg-faint dtl:text-[11px] dtl:font-semibold dtl:text-muted"
        >
          {member.person.charAt(0)}
        </span>
      )}
      <span className="dtl:grid dtl:min-w-0">
        <span className="dtl:truncate dtl:text-[12.5px] dtl:font-medium dtl:text-strong">{member.person}</span>
        {member.character && <span className="dtl:truncate dtl:text-[11px] dtl:text-muted">{member.character}</span>}
      </span>
    </li>
  );
}

/** Antes del primer evento: una ficha vacía que indica qué hacer. */
function Empty() {
  return (
    <div className="dtl:grid dtl:min-h-80 dtl:place-items-center dtl:rounded-xl dtl:border dtl:border-dashed dtl:border-faint dtl:bg-page/40 dtl:p-6 dtl:text-center">
      <div className="dtl:grid dtl:justify-items-center dtl:gap-3">
        <span
          aria-hidden="true"
          className="dtl:grid dtl:aspect-[2/3] dtl:w-16 dtl:place-items-center dtl:rounded-lg dtl:border dtl:border-dashed dtl:border-mid/50 dtl:text-muted"
        >
          <svg viewBox="0 0 24 24" className="dtl:size-6 dtl:animate-nudge">
            <path
              d="M15 6l-6 6 6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <b className="dtl:text-[14px] dtl:font-semibold dtl:text-strong">Elige un título del catálogo</b>
        <p className="dtl:m-0 dtl:max-w-60 dtl:text-[12.5px] dtl:leading-relaxed dtl:text-muted">
          La ficha escucha el evento <code className="dtl:font-mono dtl:text-[11.5px] dtl:text-text">mfe:select</code> y
          pide a TVmaze la nota, el resumen y el elenco.
        </p>
      </div>
    </div>
  );
}
