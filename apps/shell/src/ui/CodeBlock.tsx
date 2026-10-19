export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="my-[22px] overflow-x-auto rounded-xl border border-line-soft bg-card px-[18px] py-4 font-mono text-[12.5px]/[1.6] text-text">
      <code>{children}</code>
    </pre>
  );
}
