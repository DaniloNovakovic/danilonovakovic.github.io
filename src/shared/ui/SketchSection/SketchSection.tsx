import type { ReactNode } from 'react';
import { SectionHeader } from '../SectionHeader';

interface SketchSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function SketchSection({ id, title, children }: SketchSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="w-full scroll-mt-20">
      <SectionHeader id={`${id}-heading`}>{title}</SectionHeader>
      <div className="[&_.text-center.font-mono]:hidden">{children}</div>
    </section>
  );
}
