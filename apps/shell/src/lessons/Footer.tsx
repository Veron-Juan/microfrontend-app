export function Footer() {
  return (
    <footer className="mt-[72px] border-t border-line-soft pt-6 text-[13px] text-muted">
      <p>
        Cinco servidores en tu máquina: <code>npm install</code> y luego <code>npm run dev</code>. Las figuras
        isométricas se dibujaron con el kit de la skill{" "}
        <a className="underline underline-offset-2 hover:text-strong" href="https://skills.wheresryan.sh/anatomy">
          anatomy
        </a>{" "}
        (MIT).
      </p>
    </footer>
  );
}
