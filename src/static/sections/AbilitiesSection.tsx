import type { ReactNode } from 'react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { SketchSection, Tag } from '@/shared/ui';

function AbilityRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b-2 border-dashed border-[#1a1a1a]/30 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <h3 className="text-base font-bold sm:pt-0.5">{label}</h3>
      {children}
    </div>
  );
}

export function AbilitiesSection() {
  const messages = useMessages();
  const { abilities } = getPortfolioData(messages);
  const labels = messages.portfolio.abilities;

  return (
    <SketchSection id="abilities" title={labels.title}>
      <div>
        <AbilityRow label={labels.skills}>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill) => (
              <Tag key={skill}>{skill}</Tag>
            ))}
          </div>
        </AbilityRow>
        <AbilityRow label={labels.tools}>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool) => (
              <Tag key={tool}>{tool}</Tag>
            ))}
          </div>
        </AbilityRow>
        <AbilityRow label={labels.languages}>
          <p className="text-base">{abilities.languages.join(' · ')}</p>
        </AbilityRow>
      </div>
    </SketchSection>
  );
}
