import { toggleInspector, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import type { ButtonVariant } from "../ui/button-class.ts";

/** El interruptor del inspector: el de la barra de arriba y el de la ventana de la demo son el mismo. */
export function InspectorSwitch({ variant = "pill", hotkey = true }: { variant?: ButtonVariant; hotkey?: boolean }) {
  const inspector = useStore((s) => s.inspector);
  return (
    <Button
      variant={variant}
      role="switch"
      aria-checked={inspector}
      onClick={toggleInspector}
      className="group max-[560px]:px-2.5 max-[560px]:py-1.5"
    >
      <span className="relative h-[15px] w-[26px] shrink-0 rounded-full bg-line transition-colors duration-250 group-aria-checked:bg-strong">
        <span className="absolute top-0.5 left-0.5 size-[11px] rounded-full bg-card shadow-[0_1px_2px_#0003] transition-transform duration-250 ease-out-soft group-aria-checked:translate-x-[11px]" />
      </span>
      Inspector {hotkey && <kbd className="max-[560px]:hidden">I</kbd>}
    </Button>
  );
}
