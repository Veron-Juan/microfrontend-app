// La guía de programación: cambia una vez al día, así que se genera en el build (SSG).

export interface Channel {
  number: number;
  name: string;
  /** Programas en orden; span es cuántas horas ocupa cada uno. */
  slots: { title: string; span: number }[];
}

export interface GuideProps {
  built: string;
  channels: Channel[];
  hours: string[];
  buildMs: number;
}

export function Guide({ built, channels, hours, buildMs }: GuideProps) {
  return (
    <section className="gde">
      <style>{CSS}</style>
      <header className="gde-head">
        <h3>Guía de programación</h3>
        <span className="gde-stamp">generada en el build el <b>{built}</b></span>
      </header>
      <div className="gde-scroll">
        <table className="gde-grid">
          <thead>
            <tr>
              <th>Canal</th>
              {hours.map((hour) => <th key={hour}>{hour}</th>)}
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.name}>
                <th><span className="gde-num">{channel.number}</span>{channel.name}</th>
                {channel.slots.map((slot, index) => (
                  <td key={index} colSpan={slot.span}><span>{slot.title}</span></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="gde-foot">
        <span>{channels.length} canales × {hours.length} horas</span>
        <span>generado en {buildMs} ms, una sola vez</span>
        <span>servido como archivo estático desde CDN</span>
      </footer>
    </section>
  );
}

const CSS = `
.gde{font-family:Inter,system-ui,sans-serif;display:grid;gap:14px}
.gde-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.gde-head h3{margin:0;font-size:15px;font-weight:600;color:var(--anatomy-strong,#e6e6e6)}
.gde-stamp{font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.gde-stamp b{color:var(--mfe-ssg,#3dd68c);font-weight:500}
.gde-scroll{overflow-x:auto;border:1px solid var(--anatomy-faint,#2a2a2a);border-radius:10px}
.gde-grid{border-collapse:collapse;width:100%;min-width:620px;font-size:12px}
.gde-grid th,.gde-grid td{border-bottom:1px solid var(--anatomy-faint,#2a2a2a);padding:8px 10px;text-align:left;white-space:nowrap}
.gde-grid thead th{font:10px ui-monospace,monospace;letter-spacing:.08em;color:var(--anatomy-muted,#8c8c90);font-weight:400}
.gde-grid tbody th{font-weight:550;color:var(--anatomy-strong,#e6e6e6)}
.gde-grid td{border-left:1px solid var(--anatomy-faint,#2a2a2a);color:var(--anatomy-text,#a3a3a3)}
.gde-grid tr:last-child>*{border-bottom:0}
.gde-num{display:inline-block;width:28px;font:10px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.gde-foot{display:flex;gap:16px;flex-wrap:wrap;font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
`;
