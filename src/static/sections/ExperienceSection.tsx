import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Badge, Card, LinkButton, SketchSection } from '@/shared/ui';

export function ExperienceSection() {
  const messages = useMessages();
  const { experiences } = getPortfolioData(messages);

  return (
    <SketchSection id="experience" title={messages.portfolio.experience.title}>
      <div className="space-y-8">
        {experiences.map((exp) => (
          <Card key={`${exp.company}-${exp.period}`}>
            <div className="mb-4 flex flex-col border-b-2 border-gray-100 pb-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-bold">{exp.title}</h3>
              <Badge shape="pill" className="font-mono text-sm normal-case tracking-normal">{exp.period}</Badge>
            </div>
            <p className="mb-2 text-lg font-semibold">
              {exp.companyUrl ? (
                <LinkButton
                  href={exp.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="quiet"
                  className="inline p-0 text-lg normal-case tracking-normal"
                  aria-label={messages.navigation.opensInNewTab(exp.company)}
                >
                  {exp.company}
                </LinkButton>
              ) : (
                <span>{exp.company}</span>
              )}
            </p>
            <p className="text-base leading-relaxed text-gray-700">{exp.description}</p>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}
