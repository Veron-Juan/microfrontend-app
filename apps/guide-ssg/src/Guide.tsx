/** @jsxRuntime automatic */
// La guía de programación: cambia una vez al día, así que se genera en el build (SSG).
// (El pragma de arriba fija el runtime de JSX aunque tsx no vea este tsconfig, p. ej. en los tests.)
import type { Channel } from "./schedule.ts";

export interface GuideProps {
  built: string;
  channels: readonly Channel[];
  hours: readonly string[];
  buildMs: number;
}

export function Guide({ built, channels, hours, buildMs }: GuideProps) {
  return (
    <section className="gde:grid gde:gap-3.5 gde:font-sans">
      <header className="gde:flex gde:flex-wrap gde:items-baseline gde:justify-between gde:gap-3">
        <h3 className="gde:m-0 gde:text-[15px] gde:font-semibold gde:text-strong">Guía de programación</h3>
        <span className="gde:font-mono gde:text-[11px] gde:leading-[normal] gde:text-muted">
          generada en el build el <b className="gde:font-medium gde:text-ssg">{built}</b>
        </span>
      </header>
      <div className="gde:overflow-x-auto gde:rounded-[10px] gde:border gde:border-faint">
        <table className="gde:w-full gde:min-w-155 gde:border-collapse gde:text-[12px]">
          <thead>
            <tr>
              {["Canal", ...hours].map((label) => (
                <th
                  key={label}
                  className="gde:border-b gde:border-faint gde:px-2.5 gde:py-2 gde:text-left gde:font-mono gde:text-[10px] gde:leading-[normal] gde:font-normal gde:tracking-[.08em] gde:whitespace-nowrap gde:text-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              // En la última fila el borde inferior lo pone el contenedor.
              <tr key={channel.number} className="gde:last:*:border-b-0">
                <th className="gde:border-b gde:border-faint gde:px-2.5 gde:py-2 gde:text-left gde:font-[550] gde:whitespace-nowrap gde:text-strong">
                  <span className="gde:inline-block gde:w-7 gde:font-mono gde:text-[10px] gde:leading-[normal] gde:font-normal gde:text-muted">
                    {channel.number}
                  </span>
                  {channel.name}
                </th>
                {channel.slots.map((slot, index) => (
                  <td
                    key={index}
                    colSpan={slot.span}
                    className="gde:border-b gde:border-l gde:border-faint gde:px-2.5 gde:py-2 gde:text-left gde:whitespace-nowrap gde:text-text"
                  >
                    {slot.title}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="gde:flex gde:flex-wrap gde:gap-4 gde:font-mono gde:text-[11px] gde:leading-[normal] gde:text-muted">
        <span>
          {channels.length} canales × {hours.length} horas
        </span>
        <span>generado en {buildMs} ms, una sola vez</span>
        <span>servido como archivo estático desde CDN</span>
      </footer>
    </section>
  );
}
