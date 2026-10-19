import { createElement as h } from "react";

// La guía de programación: cambia una vez al día, así que se genera en el build (SSG).
export function Guide({ built, channels, hours, buildMs }) {
  return h("section", { className: "gde" },
    h("style", null, CSS),
    h("header", { className: "gde-head" },
      h("h3", null, "Guía de programación"),
      h("span", { className: "gde-stamp" }, "generada en el build el ", h("b", null, built)),
    ),
    h("div", { className: "gde-scroll" },
      h("table", { className: "gde-grid" },
        h("thead", null, h("tr", null, h("th", null, "Canal"), hours.map((hour) => h("th", { key: hour }, hour)))),
        h("tbody", null,
          channels.map((channel) =>
            h("tr", { key: channel.name },
              h("th", null, h("span", { className: "gde-num" }, channel.number), channel.name),
              channel.slots.map((slot, index) => h("td", { key: index, colSpan: slot.span }, h("span", null, slot.title))),
            ),
          ),
        ),
      ),
    ),
    h("footer", { className: "gde-foot" },
      h("span", null, channels.length, " canales × ", hours.length, " horas"),
      h("span", null, "generado en ", buildMs, " ms, una sola vez"),
      h("span", null, "servido como archivo estático desde CDN"),
    ),
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
