import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card, SketchSection } from '@/shared/ui';

export function AboutSection() {
  const messages = useMessages();
  const { profile } = getPortfolioData(messages);

  return (
    <SketchSection id="about" title={messages.portfolio.profile.title}>
      <Card>
        <p className="mb-6 text-lg italic leading-relaxed">"{profile.about}"</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-bold text-gray-600">{messages.portfolio.profile.name}</span>
            <p className="text-xl">{profile.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">{messages.portfolio.profile.location}</span>
            <p className="text-xl">{profile.location}</p>
          </div>
        </div>
      </Card>
    </SketchSection>
  );
}
