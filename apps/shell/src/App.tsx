import { Toc } from "./layout/Toc.tsx";
import { TopBar } from "./layout/TopBar.tsx";
import { useHotkey } from "./layout/use-hotkey.ts";
import { useTheme } from "./layout/use-theme.ts";
import { Composition } from "./lessons/Composition.tsx";
import { Demo } from "./lessons/Demo.tsx";
import { Failures } from "./lessons/Failures.tsx";
import { Footer } from "./lessons/Footer.tsx";
import { Hero } from "./lessons/Hero.tsx";
import { Intro } from "./lessons/Intro.tsx";
import { Rendering } from "./lessons/Rendering.tsx";
import { SharedDeps } from "./lessons/SharedDeps.tsx";
import { WhatIs } from "./lessons/WhatIs.tsx";
import { WhenToUse } from "./lessons/WhenToUse.tsx";
import { toggleInspector } from "./state/store.ts";

export default function App() {
  const { theme, toggle } = useTheme();
  useHotkey("i", toggleInspector);

  return (
    // "iso" and data-theme are for the figures kit, which defines its palette on that element.
    <div className="iso min-h-screen overflow-x-clip bg-page text-text" data-theme={theme} id="top">
      <TopBar theme={theme} onToggleTheme={toggle} />
      <main>
        {/* The hero spans the whole width; the table of contents shows up once it's left behind. */}
        <Hero />
        <div className="mx-auto grid w-[min(1180px,100%-32px)] grid-cols-[200px_minmax(0,1fr)] gap-14 max-[900px]:grid-cols-1 max-[900px]:gap-0">
          <Toc />
          <div className="min-w-0 pb-24">
            <Intro />
            <WhatIs />
            <Demo />
            <Composition />
            <Rendering />
            <SharedDeps />
            <Failures />
            <WhenToUse />
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
}
