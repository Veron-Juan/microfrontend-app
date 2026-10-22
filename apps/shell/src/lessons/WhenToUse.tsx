import { Cards } from "../ui/Card.tsx";
import { cardClass } from "../ui/card-class.ts";
import { Lesson, Rules } from "../ui/Lesson.tsx";

/** Los términos de la lección, agrupados por lo que nombran. */
const GLOSSARY = [
  { term: "Shell / host", group: "piezas", definition: "La app que contiene y orquesta a las demás." },
  { term: "Remote", group: "piezas", definition: "Una app que expone pedazos para que otra los consuma." },
  {
    term: "mf-manifest.json",
    group: "conexión",
    definition: "Lo que publica un remote de Module Federation: qué expone, qué comparte y dónde están sus archivos.",
  },
  {
    term: "Discovery",
    group: "conexión",
    definition: "El servicio (o archivo) que dice dónde vive cada micro-frontend en cada entorno. Aquí, remotes.json.",
  },
  { term: "Fragmento", group: "conexión", definition: "Un trozo de HTML sin <html> ni <body>, listo para incrustar." },
  {
    term: "ESI / SSI",
    group: "conexión",
    definition: "Etiquetas que un CDN o un servidor reemplaza por fragmentos antes de responder.",
  },
  {
    term: "Hidratación",
    group: "render",
    definition: "Conectar JavaScript a un HTML que ya llegó renderizado para volverlo interactivo.",
  },
  {
    term: "Design tokens",
    group: "estilo",
    definition: "Valores de diseño compartidos (colores, tipografías). Cada app compila sus propios estilos con ellos.",
  },
] as const;

export function WhenToUse() {
  return (
    <Lesson id="cuando" title="¿Cuándo conviene?" kicker="Es una solución organizacional antes que técnica.">
      <Cards columns="two">
        <div className={cardClass}>
          <h3 className="mb-1.5 text-sm font-semibold text-strong">Conviene cuando…</h3>
          <Rules>
            <li>Hay varios equipos trabajando sobre el mismo producto y se bloquean entre sí.</li>
            <li>Partes del sitio tienen ritmos de cambio muy distintos (la guía vs. el catálogo).</li>
            <li>Necesitas migrar de a poco una app vieja sin reescribirla de una vez.</li>
            <li>Distintas partes necesitan distintas formas de renderizar.</li>
          </Rules>
        </div>
        <div className={cardClass}>
          <h3 className="mb-1.5 text-sm font-semibold text-strong">Cuesta…</h3>
          <Rules>
            <li>Más infraestructura: varios pipelines, servidores y versiones que vigilar.</li>
            <li>Consistencia visual: hace falta un design system compartido (aquí, @mfe/design-tokens).</li>
            <li>Rendimiento: dependencias duplicadas si no se comparten bien.</li>
            <li>Disciplina: contratos de eventos y rutas que nadie puede romper.</li>
          </Rules>
        </div>
      </Cards>
      <Glossary />
    </Lesson>
  );
}

function Glossary() {
  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[26px] font-medium tracking-[-.01em] text-strong">Glosario</h3>
        <span className="font-mono text-[11px] tracking-[.1em] text-muted uppercase">
          {GLOSSARY.length} términos de esta lección
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
        {GLOSSARY.map(({ term, group, definition }) => (
          <div
            key={term}
            className="group grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-xl border border-line-soft bg-card p-4 shadow-lift transition duration-300 ease-out-soft hover:-translate-y-0.5 hover:border-line"
          >
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-lg bg-line-soft font-serif text-[22px] font-medium text-strong transition-colors group-hover:bg-strong group-hover:text-card"
            >
              {term.charAt(0).toUpperCase()}
            </span>
            <div className="grid content-start gap-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="font-mono text-[13.5px] font-semibold text-strong">{term}</dt>
                <span className="rounded-full border border-line px-2 py-px font-mono text-[10px] tracking-[.06em] text-muted uppercase">
                  {group}
                </span>
              </div>
              <dd className="text-[13.5px]/[1.55] text-text">{definition}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
