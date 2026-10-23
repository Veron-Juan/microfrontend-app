import { RenderFigure } from "../figures/RenderFigure.tsx";
import { Chip } from "../ui/Chip.tsx";
import { Lesson, Note, Prose } from "../ui/Lesson.tsx";
import { Table } from "../ui/Table.tsx";

const COMPARISON = [
  ["The HTML is built", "at build time, in CI", "on the server, on every request", "in the browser, with JavaScript"],
  ["Data", "as of build time", "fresh (or from a short cache)", "fetched by the browser itself"],
  [
    "First content",
    "very fast (file on a CDN)",
    "fast, depends on the server",
    "after downloading and running JS, and fetching the data",
  ],
  ["Server cost", "almost none", "per request", "static files only"],
  ["SEO", "excellent", "excellent", "harder"],
  [
    "Interactivity",
    "needs hydration or islands",
    "needs hydration or islands",
    "as soon as the JS loads, no hydration",
  ],
  ["In this app", "Episode guide (TVmaze)", "News (TheSportsDB and TVmaze)", "Catalog and details (TVmaze)"],
] as const;

export function Rendering() {
  return (
    <Lesson
      id="rendering"
      title="SSR, SSG and CSR on the same page"
      kicker="Each remote picks the way of rendering that suits it best."
    >
      <Prose>
        <p>
          The question is always the same: <b>where and when does the component turn into HTML?</b> (In CSR there's no
          intermediate HTML: React creates the DOM directly in the browser.) Since each micro-frontend deploys on its
          own, each one can answer it differently. All three answers live together on this page.
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
        Note: in this demo the shell inserts the fragments from the browser, so their HTML isn't in the first document.
        Here SSR and SSG don't improve SEO or first paint, and they aren't hydrated either: News and the Guide are HTML
        with no JavaScript. To get those benefits, the fragments are composed on the server or at the edge.
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
