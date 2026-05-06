import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card, SketchSection, Tag } from '@/shared/ui';

export function AbilitiesSection() {
  const messages = useMessages();
  const { abilities } = getPortfolioData(messages);

  return (
    <SketchSection id="abilities" title={messages.portfolio.abilities.title}>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{messages.portfolio.abilities.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{messages.portfolio.abilities.tools}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool) => <Tag key={tool}>{tool}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{messages.portfolio.abilities.languages}</h3>
          <ul className="space-y-2">
            {abilities.languages.map((language) => (
              <li key={language} className="flex items-center gap-2 text-base">
                <span className="h-2 w-2 rounded-full bg-[#1a1a1a]" />
                {language}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </SketchSection>
  );
}
