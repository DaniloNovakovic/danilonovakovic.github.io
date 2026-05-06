import { useMemo } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '@/shared/content/portfolio/data';
import { messages } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import { HeroContactLinks } from './HeroContactLinks';
import { AbilitiesSection } from './sections/AbilitiesSection';
import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { HobbiesSection } from './sections/HobbiesSection';
import { ProjectsSection } from './sections/ProjectsSection';

interface StaticPortfolioProps {
  onSwitchToInteractive: () => void;
}

export default function StaticPortfolio({ onSwitchToInteractive }: StaticPortfolioProps) {
  const { profile } = PORTFOLIO_DATA;
  const year = useMemo(() => new Date().getFullYear(), []);

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
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/70 sm:text-base">
            {profile.location}
          </p>
          <p className="mt-2 max-w-xl text-sm italic leading-relaxed text-[#1a1a1a]/80 sm:text-base">
            "{profile.about}"
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
          <ContactSection />
        </div>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/30 pt-6 text-center text-xs text-[#1a1a1a]/60 sm:mt-24">
          <p>
            {messages.staticPortfolio.footerPrompt}{' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchToInteractive}
              className="p-0 text-xs"
            >
              {messages.staticPortfolio.footerCta}
            </Button>
          </p>
          <p>{messages.staticPortfolio.copyright(year, profile.name)}</p>
        </footer>
      </main>
    </div>
  );
}
