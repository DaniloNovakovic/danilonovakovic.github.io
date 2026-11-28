import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { SketchSection } from '@/shared/ui';
import { PlayerDoodle } from '../PlayerDoodle';

export function AboutSection() {
  const messages = useMessages();
  const { profile } = getPortfolioData(messages);

  return (
    <SketchSection id="about" title={messages.portfolio.profile.title}>
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-10">
        <div className="relative w-40 shrink-0 -rotate-2 border border-[#1a1a1a]/30 bg-white p-2 shadow-sm sm:w-44">
          <span
            aria-hidden
            className="absolute -top-2.5 left-1/2 h-5 w-14 -translate-x-1/2 rotate-2 bg-[#e8dcb8]/80 shadow-sm"
          />
          <div className="flex aspect-square items-end justify-center bg-[#f4f1ea] pt-3">
            <PlayerDoodle className="h-full w-auto" />
          </div>
        </div>
        <p className="text-base leading-relaxed text-[#1a1a1a]/85 sm:pt-2 sm:text-lg">{profile.about}</p>
      </div>
    </SketchSection>
  );
}
