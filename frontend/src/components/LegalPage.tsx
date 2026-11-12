import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <article className="glass flex flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="text-sm text-white/60">{intro}</p>
        <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/75">
          {children}
        </div>
      </article>
    </div>
  );
}
