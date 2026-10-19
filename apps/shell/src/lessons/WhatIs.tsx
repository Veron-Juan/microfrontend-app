import { RackFigure } from "../figures/RackFigure.tsx";
import { Card, Cards } from "../ui/Card.tsx";
import { Lesson, Prose } from "../ui/Lesson.tsx";

export function WhatIs() {
  return (
    <Lesson id="que-es" title="Qué es un micro-frontend" kicker="Microservicios, pero para la interfaz.">
      <Prose>
        <p>
          Una aplicación web grande se parte en <b>pedazos verticales</b>, cada uno dueño de una parte del producto (el
          catálogo, el reproductor, la guía). Cada pedazo lo construye, prueba y despliega <b>un equipo distinto</b>,
          sin esperar a los demás. Un <b>shell</b> (también llamado <em>host</em> o <em>contenedor</em>) decide dónde va
          cada pedazo y los une en el navegador o en el servidor.
        </p>
      </Prose>
      <Cards columns="four">
        <Card title="Deploy independiente">
          El equipo del catálogo publica la versión 1.5 sin tocar el reproductor ni el shell.
        </Card>
        <Card title="Equipos autónomos">
          Cada equipo es dueño de su pedazo de punta a punta: código, datos, pruebas y guardia.
        </Card>
        <Card title="Agnóstico de tecnología">
          Aquí todo es React, pero un remote podría ser Vue o HTML plano. El contrato es la integración.
        </Card>
        <Card title="Fallos aislados">
          Si un remote cae, su espacio muestra un aviso y el resto de la página sigue funcionando.
        </Card>
      </Cards>
      <RackFigure />
      <Prose>
        <p>
          La figura es esta misma página. El chasis es el <b>shell</b>: pone el layout, el bus de eventos y la
          navegación. Cada módulo es un <b>remote</b> que se enchufa cuando termina de descargarse. Ninguno sabe que los
          otros existen; solo conocen el contrato del zócalo.
        </p>
      </Prose>
    </Lesson>
  );
}
