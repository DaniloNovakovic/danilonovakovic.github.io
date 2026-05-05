import { PORTFOLIO_DATA } from '@shared/content/portfolio/data';
import { PORTFOLIO_TEXT } from '@shared/content/portfolio/text';
import { Card, SketchSection, Tag } from '@shared/ui';

export function AbilitiesSection() {
  const { abilities } = PORTFOLIO_DATA;

  return (
    <SketchSection id="abilities" title={PORTFOLIO_TEXT.abilities.title}>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.tools}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool) => <Tag key={tool}>{tool}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.languages}</h3>
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
