import { Button } from "../ui/Button.tsx";

interface PlaybackControlsProps {
  paused: boolean;
  onToggle: () => void;
  onReplay: () => void;
}

/** A figure's pause/resume and replay buttons: icons only, with the action as their accessible name. */
export function PlaybackControls({ paused, onToggle, onReplay }: PlaybackControlsProps) {
  const toggle = paused ? "Resume" : "Pause";
  return (
    <>
      <Button variant="mini" className="p-1.5!" onClick={onToggle} aria-label={toggle} title={toggle}>
        <svg viewBox="0 0 16 16" className="size-3 fill-current" aria-hidden="true">
          {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
        </svg>
      </Button>
      <Button variant="mini" className="p-1.5!" onClick={onReplay} aria-label="Replay" title="Replay">
        <svg viewBox="0 0 16 16" className="size-3 fill-none stroke-current" strokeWidth={1.8} aria-hidden="true">
          <path d="M3 8a5 5 0 1 0 1.6-3.7" strokeLinecap="round" />
          <path d="M4.5 1.8v2.8h2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Button>
    </>
  );
}
