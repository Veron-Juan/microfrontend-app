import { AssemblyFigure } from "../figures/AssemblyFigure.tsx";
import { Card, Cards } from "../ui/Card.tsx";
import { Lesson, Prose } from "../ui/Lesson.tsx";

export function WhatIs() {
  return (
    <Lesson id="what-is" title="What a micro-frontend is" kicker="Microservices, but for the interface.">
      <Prose>
        <p>
          A large web application is split into <b>vertical slices</b>, each one owning a part of the product (the
          catalog, the details page, the guide). Each slice is built, tested and deployed by <b>a different team</b>,
          without waiting for the others. A <b>shell</b> (also called a <em>host</em> or <em>container</em>) decides
          where each slice goes and puts them together in the browser or on the server.
        </p>
      </Prose>
      <Cards columns="four">
        <Card title="Independent deploys">
          The catalog team ships version 2.2 without touching the details page or the shell.
        </Card>
        <Card title="Autonomous teams">Each team owns its slice end to end: code, data, tests and on-call.</Card>
        <Card title="Technology agnostic">
          Everything here is React, but a remote could be Vue or plain HTML. The contract is the integration.
        </Card>
        <Card title="Isolated failures">
          If a remote goes down, its space shows a notice and the rest of the page keeps working.
        </Card>
      </Cards>
      <AssemblyFigure />
      <Prose>
        <p>
          The figure is this very page, taken apart. At the bottom is the <b>shell</b>: it provides the frame, the
          navigation and a slot for each piece. Above it, each <b>remote</b> arrives from its own server and drops into
          its slot when it finishes downloading. None of them knows the others exist; they only know their slot's
          contract.
        </p>
      </Prose>
    </Lesson>
  );
}
