import { Gamepad2, MapPin } from 'lucide-react';
import { getPortfolioData } from '@/shared/portfolio';
import { useMessages } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { HeroContactLinks } from './HeroContactLinks';
import { PlayerDoodle } from './PlayerDoodle';
import { AboutSection } from './sections/AboutSection';
import { AbilitiesSection } from './sections/AbilitiesSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { HobbiesSection } from './sections/HobbiesSection';
import { ProjectsSection } from './sections/ProjectsSection';

interface StaticPortfolioProps {
  onSwitchToInteractive: () => void;
}

// Read once at load; the footer year doesn't need to update while the page is open.
const COPYRIGHT_YEAR = new Date().getFullYear();

export default function StaticPortfolio({ onSwitchToInteractive }: StaticPortfolioProps) {
  const messages = useMessages();
  const { profile } = getPortfolioData(messages);

  return (
    <div className="relative min-h-[100dvh] min-h-dvh w-full overflow-x-hidden bg-[#f4f1ea]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.05]" />

      <Button
        variant="floating"
        size="sm"
        onClick={onSwitchToInteractive}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label={messages.staticPortfolio.switchToInteractive}
      >
        <Gamepad2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">{messages.staticPortfolio.tryInteractive}</span>
        <span className="sm:hidden">{messages.staticPortfolio.interactive}</span>
      </Button>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] sm:px-6 sm:pt-16">
        <header className="mb-12 flex flex-col items-center gap-4 text-center sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
            {messages.staticPortfolio.eyebrow}
          </p>
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-6xl">{profile.name}</h1>
          <p className="text-base font-bold text-[#1a1a1a] sm:text-lg">{messages.staticPortfolio.role}</p>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/60">
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {messages.staticPortfolio.basedIn(profile.location)}
          </p>
          <div className="mt-2">
            <HeroContactLinks />
          </div>
        </header>

        <div className="flex flex-col gap-14 sm:gap-20">
          <AboutSection />
          <ExperienceSection />
          <ProjectsSection />
          <AbilitiesSection />
          <HobbiesSection />
        </div>

        <section
          aria-labelledby="closing-title"
          className="mt-20 flex flex-col items-center gap-4 text-center sm:mt-28"
        >
          <h2 id="closing-title" className="text-3xl font-bold text-[#1a1a1a] sm:text-4xl">
            {messages.staticPortfolio.closingTitle}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-[#1a1a1a]/80">{messages.staticPortfolio.closingText}</p>
          <div className="mt-2">
            <HeroContactLinks />
          </div>
          <div className="mt-6 flex items-end gap-3">
            <PlayerDoodle className="h-16 w-auto" />
            <p className="mb-2 -rotate-3 text-2xl font-bold text-[#1a1a1a]/80">
              {messages.staticPortfolio.signOff(profile.name.split(' ')[0])}
            </p>
          </div>
        </section>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/30 pt-6 text-center text-xs text-[#1a1a1a]/60 sm:mt-16">
          <p>
            {messages.staticPortfolio.footerPrompt}{' '}
            <Button variant="ghost" size="sm" onClick={onSwitchToInteractive} className="p-0 text-xs">
              {messages.staticPortfolio.footerCta}
            </Button>
          </p>
          <p>{messages.staticPortfolio.copyright(COPYRIGHT_YEAR, profile.name)}</p>
        </footer>
      </main>
    </div>
  );
}
