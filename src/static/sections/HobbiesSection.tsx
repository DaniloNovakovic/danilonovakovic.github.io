import { PORTFOLIO_DATA } from '@/shared/content/portfolio/data';
import { Card, SketchSection } from '@/shared/ui';

export function HobbiesSection() {
  const { hobbies } = PORTFOLIO_DATA;

  return (
    <SketchSection id="hobbies" title="Hobbies">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hobbies.map((hobby) => (
          <Card as="article" key={hobby.id} padding="md">
            <h3 className="mb-2 text-lg font-bold text-[#1a1a1a]">{hobby.name}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{hobby.description}</p>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}
