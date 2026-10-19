import { createElement as h } from "react";

// Componente React que solo se ejecuta en el servidor. El navegador recibe HTML ya armado.
export function News({ rendered, requestId, served, scores, headlines, timing }) {
  return h("section", { className: "nws", "data-request": requestId },
    h("style", null, CSS),
    h("header", { className: "nws-head" },
      h("h3", null, "Novedades en vivo"),
      h("span", { className: "nws-stamp" }, "renderizado en el servidor a las ", h("b", null, rendered)),
    ),
    h("div", { className: "nws-grid" },
      h("ul", { className: "nws-scores" },
        scores.map((match) =>
          h("li", { key: match.home },
            h("span", { className: "nws-min" }, match.minute + "'"),
            h("span", { className: "nws-team" }, match.home),
            h("b", null, match.goals[0] + " – " + match.goals[1]),
            h("span", { className: "nws-team nws-away" }, match.away),
          ),
        ),
      ),
      h("ol", { className: "nws-lines" }, headlines.map((line) => h("li", { key: line }, line))),
    ),
    h("footer", { className: "nws-foot" },
      h("span", null, "request ", h("code", null, requestId)),
      h("span", null, "request nº ", served, " de este servidor"),
      h("span", null, "API de marcadores ", timing.data, " ms"),
    ),
  );
}

const CSS = `
.nws{font-family:Inter,system-ui,sans-serif;display:grid;gap:14px}
.nws-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
.nws-head h3{margin:0;font-size:15px;font-weight:600;color:var(--anatomy-strong,#e6e6e6)}
.nws-stamp{font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.nws-stamp b{color:var(--mfe-ssr,#f5a524);font-weight:500}
.nws-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:18px}
@media (max-width:640px){.nws-grid{grid-template-columns:1fr}}
.nws-scores,.nws-lines{margin:0;padding:0;list-style:none;display:grid;gap:6px}
.nws-scores li{display:grid;grid-template-columns:34px 1fr auto 1fr;gap:8px;align-items:center;padding:8px 10px;border:1px solid var(--anatomy-faint,#2a2a2a);border-radius:8px;font-size:13px;color:var(--anatomy-text,#a3a3a3)}
.nws-scores b{font:600 14px ui-monospace,monospace;color:var(--anatomy-strong,#e6e6e6);font-variant-numeric:tabular-nums}
.nws-min{font:11px ui-monospace,monospace;color:var(--mfe-ssr,#f5a524)}
.nws-away{text-align:right}
.nws-lines{counter-reset:n}
.nws-lines li{counter-increment:n;font:15px/1.35 "EB Garamond",Georgia,serif;color:var(--anatomy-strong,#e6e6e6);padding-left:26px;position:relative}
.nws-lines li::before{content:counter(n,decimal-leading-zero);position:absolute;left:0;top:3px;font:10px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.nws-foot{display:flex;gap:16px;flex-wrap:wrap;font:11px ui-monospace,monospace;color:var(--anatomy-muted,#8c8c90)}
.nws-foot code{color:var(--anatomy-text,#a3a3a3)}
`;
