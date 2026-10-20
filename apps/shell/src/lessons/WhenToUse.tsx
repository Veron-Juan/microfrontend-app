import { Fragment } from "react";
import { Cards } from "../ui/Card.tsx";
import { cardClass } from "../ui/card-class.ts";
import { Lesson, Rules } from "../ui/Lesson.tsx";

const GLOSSARY = [
  ["Shell / host", "La app que contiene y orquesta a las demás."],
  ["Remote", "Una app que expone pedazos para que otro los consuma."],
  [
    "mf-manifest.json",
    "Lo que publica un remote de Module Federation: qué expone, qué comparte y dónde están sus archivos.",
  ],
  ["Discovery", "El servicio (o archivo) que dice dónde vive cada micro-frontend en cada entorno. Aquí, remotes.json."],
  ["Fragmento", "Un trozo de HTML sin <html> ni <body>, listo para incrustar."],
  ["Hidratación", "Conectar JavaScript a un HTML que ya llegó renderizado para volverlo interactivo."],
  ["ESI / SSI", "Etiquetas que un CDN o servidor reemplaza por fragmentos antes de responder."],
  [
    "Design tokens",
    "Valores de diseño compartidos (colores, tipografías). Cada app compila sus propios estilos a partir de ellos.",
  ],
] as const;

export function WhenToUse() {
  return (
    <Lesson id="cuando" title="¿Cuándo conviene?" kicker="Es una solución organizacional antes que técnica.">
      <Cards columns="two">
        <div className={cardClass}>
          <h3 className="mb-1.5 text-sm font-semibold text-strong">Conviene cuando…</h3>
          <Rules>
            <li>Hay varios equipos trabajando sobre el mismo producto y se bloquean entre sí.</li>
            <li>Partes del sitio tienen ritmos de cambio muy distintos (la guía vs. el reproductor).</li>
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
      <dl className="mt-7 grid max-w-[720px] grid-cols-[minmax(120px,auto)_1fr] gap-x-5 gap-y-2 text-sm [&>dt]:font-mono [&>dt]:text-[13px] [&>dt]:font-medium [&>dt]:text-strong">
        {GLOSSARY.map(([term, definition]) => (
          <Fragment key={term}>
            <dt>{term}</dt>
            <dd>{definition}</dd>
          </Fragment>
        ))}
      </dl>
    </Lesson>
  );
}
