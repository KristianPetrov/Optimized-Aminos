import { Reveal } from "@/components/reveal";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foam">
          {title}
        </h1>
        {intro && (
          <p className="mt-4 text-lg leading-relaxed text-mist">{intro}</p>
        )}
      </Reveal>
      <Reveal delay={120}>
        <div className="mt-10 space-y-8 leading-relaxed text-mist [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foam [&_p]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>
      </Reveal>
    </div>
  );
}
