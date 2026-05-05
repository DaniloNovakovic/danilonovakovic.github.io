import { PORTFOLIO_DATA } from '@/shared/content/portfolio/data';
import { PORTFOLIO_TEXT } from '@/shared/content/portfolio/text';
import { Card, SketchSection } from '@/shared/ui';

export function AboutSection() {
  const { profile } = PORTFOLIO_DATA;

  return (
    <SketchSection id="about" title={PORTFOLIO_TEXT.profile.title}>
      <Card>
        <p className="mb-6 text-lg italic leading-relaxed">"{profile.about}"</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.name}</span>
            <p className="text-xl">{profile.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.location}</span>
            <p className="text-xl">{profile.location}</p>
          </div>
        </div>
      </Card>
    </SketchSection>
  );
}
