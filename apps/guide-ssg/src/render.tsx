/** @jsxRuntime automatic */
// Turns the guide into HTML: the fragment for the shell and the standalone page.
import { renderToStaticMarkup } from "react-dom/server";
import { Guide, type GuideProps } from "./Guide.tsx";

/**
 * The shell inserts the fragment with innerHTML: the <style> goes inside so it arrives complete,
 * without requesting another stylesheet. It's concatenated outside React because React would escape characters like ">".
 */
export function renderGuideFragment(css: string, props: GuideProps): string {
  return `<style>${css}</style>${renderToStaticMarkup(<Guide {...props} />)}`;
}

/** The same guide on its own, as a full page (with the fonts the shell loads in production). */
export function standalonePage(fragment: string, css: string): string {
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>guide-ssg · standalone</title><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"><style>${css}</style></head><body><p>Remote <b>guide-ssg</b> running on its own. Reload as often as you like: the time doesn't change until the next build.</p>${fragment}</body></html>`;
}
