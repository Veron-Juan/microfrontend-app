const LINK = "underline underline-offset-2 hover:text-strong";

export function Footer() {
  return (
    <footer className="mt-[72px] grid gap-1.5 border-t border-line-soft pt-6 text-[13px] text-muted">
      <p>
        Built by <b className="font-medium">Juan</b>. The code is on{" "}
        <a className={LINK} href="https://github.com/Veron-Juan/microfrontend-app">
          GitHub
        </a>
        .
      </p>
      <p>
        The isometric figures were drawn with the kit from the{" "}
        <a className={LINK} href="https://skills.wheresryan.sh/anatomy">
          anatomy
        </a>{" "}
        skill (MIT).
      </p>
    </footer>
  );
}
