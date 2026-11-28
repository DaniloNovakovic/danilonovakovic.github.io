import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import type { Experience } from '@/shared/portfolio';
import { LinkButton, SketchSection } from '@/shared/ui';
import { cn } from '@/shared/ui/utils';

/** Bolds measured results ("92% faster") so they survive a skim. */
const METRIC = /(\d+% \w+)/;

function HighlightText({ text }: { text: string }) {
  return text.split(METRIC).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-bold text-[#1a1a1a]">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

function CompanyName({ exp }: { exp: Experience }) {
  const messages = useMessages();
  if (!exp.companyUrl) return <span>{exp.company}</span>;
  return (
    <LinkButton
      href={exp.companyUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="quiet"
      className="inline p-0 text-[length:inherit] normal-case tracking-normal"
      aria-label={messages.navigation.opensInNewTab(exp.company)}
    >
      {exp.company}
    </LinkButton>
  );
}

function TimelineDot({ current }: { current: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute -left-2.25 top-1 h-4 w-4 rounded-full border-2 border-[#1a1a1a]',
        current ? 'bg-[#1a1a1a]' : 'bg-[#f4f1ea]'
      )}
    />
  );
}

export function ExperienceSection() {
  const messages = useMessages();
  const { experiences } = getPortfolioData(messages);

  return (
    <SketchSection id="experience" title={messages.portfolio.experience.title}>
      <ol className="ml-2 border-l-2 border-dashed border-[#1a1a1a]/40">
        {experiences.map((exp, index) => (
          <li key={`${exp.company}-${exp.period}`} className="relative pb-10 pl-6 last:pb-0 sm:pl-8">
            <TimelineDot current={index === 0} />
            {exp.compact ? (
              <p className="text-sm text-gray-700">
                <span className="font-bold text-[#1a1a1a]">{exp.title}</span> · <CompanyName exp={exp} /> ·{' '}
                <span className="font-mono text-xs">{exp.period}</span>
              </p>
            ) : (
              <>
                <p className="font-mono text-xs uppercase tracking-wider text-gray-600">{exp.period}</p>
                <h3 className="mt-1 text-xl font-bold">
                  {exp.title} <span className="font-normal text-gray-600">@</span> <CompanyName exp={exp} />
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {exp.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2 text-base leading-relaxed text-gray-700">
                      <span aria-hidden className="select-none text-[#1a1a1a]">
                        –
                      </span>
                      <span>
                        <HighlightText text={highlight} />
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ol>
    </SketchSection>
  );
}
