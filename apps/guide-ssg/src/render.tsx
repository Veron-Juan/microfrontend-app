/** @jsxRuntime automatic */
// Convierte la guía en HTML: el fragmento para el shell y la página standalone.
import { renderToStaticMarkup } from "react-dom/server";
import { Guide, type GuideProps } from "./Guide.tsx";

/**
 * El shell inserta el fragmento con innerHTML: el <style> va adentro para que llegue completo,
 * sin pedir otra hoja. Se concatena fuera de React porque React escaparía caracteres como ">".
 */
export function renderGuideFragment(css: string, props: GuideProps): string {
  return `<style>${css}</style>${renderToStaticMarkup(<Guide {...props} />)}`;
}

/** La misma guía vista sola, como página completa (con las fuentes que en producción carga el shell). */
export function standalonePage(fragment: string, css: string): string {
  return `<!doctype html><html lang="es" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>guide-ssg · standalone</title><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>${css}</style></head><body><p>Remote <b>guide-ssg</b> corriendo solo. Recarga cuantas veces quieras: la hora no cambia hasta el próximo build.</p>${fragment}</body></html>`;
}
