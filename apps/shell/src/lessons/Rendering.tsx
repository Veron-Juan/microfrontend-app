import { RenderFigure } from "../figures/RenderFigure.tsx";
import { Chip } from "../ui/Chip.tsx";
import { Lesson, Note, Prose } from "../ui/Lesson.tsx";
import { Table } from "../ui/Table.tsx";

const COMPARISON = [
  ["El HTML se arma", "en el build, en CI", "en el servidor, en cada request", "en el navegador, con JavaScript"],
  ["Datos", "los del momento del build", "frescos (o de una caché corta)", "los pide el propio navegador"],
  [
    "Primer contenido",
    "muy rápido (archivo en CDN)",
    "rápido, depende del servidor",
    "después de bajar y ejecutar JS, y de pedir los datos",
  ],
  ["Costo de servidor", "casi nulo", "por cada request", "solo archivos estáticos"],
  ["SEO", "excelente", "excelente", "más difícil"],
  ["Interactividad", "necesita hidratar o islas", "necesita hidratar o islas", "en cuanto carga el JS, sin hidratar"],
  ["En esta app", "Guía de episodios (TVmaze)", "Novedades (TheSportsDB y TVmaze)", "Catálogo y ficha (TVmaze)"],
] as const;

export function Rendering() {
  return (
    <Lesson
      id="render"
      title="SSR, SSG y CSR en la misma página"
      kicker="Cada remote elige la forma de renderizar que mejor le queda."
    >
      <Prose>
        <p>
          La pregunta es siempre la misma: <b>¿dónde y cuándo se convierte el componente en HTML?</b> (En CSR no hay
          HTML intermedio: React crea el DOM directamente en el navegador.) Como cada micro-frontend se despliega solo,
          cada uno puede responderla distinto. En esta página conviven las tres respuestas.
        </p>
      </Prose>
      <RenderFigure />
      <Table headings="plain" className="min-w-[640px]">
        <thead>
          <tr>
            <th />
            <ComparisonHeading render="SSG">Static Site Generation</ComparisonHeading>
            <ComparisonHeading render="SSR">Server-Side Rendering</ComparisonHeading>
            <ComparisonHeading render="CSR">Client-Side Rendering</ComparisonHeading>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map(([label, ...cells]) => (
            <tr key={label}>
              <th>{label}</th>
              {cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <Note>
        Ojo: en esta demo el shell inserta los fragmentos desde el navegador, así que su HTML no viene en el primer
        documento. Aquí SSR y SSG no mejoran el SEO ni el primer pintado, y tampoco se hidratan: Novedades y la Guía son
        HTML sin JavaScript. Para tener esas ventajas, los fragmentos se componen en el servidor o en el edge.
      </Note>
    </Lesson>
  );
}

function ComparisonHeading({ render, children }: { render: "SSG" | "SSR" | "CSR"; children: string }) {
  return (
    <th>
      <Chip render={render} className="mr-1.5" /> {children}
    </th>
  );
}
