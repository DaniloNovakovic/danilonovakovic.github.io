import { Suspense, lazy, useMemo } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PORTFOLIO_DATA, type ContactIconId } from '../../../features/portfolio/data';
import { TEXTS } from '../../../config/content';
import { Button, Card, LinkButton, SketchSection } from '@shared/ui';

const ProfileOverlay = lazy(() => import('../../../features/portfolio/profile/ProfileOverlay'));
const ExperienceOverlay = lazy(() => import('../../../features/portfolio/experience/ExperienceOverlay'));
const ProjectsOverlay = lazy(() => import('../../../features/portfolio/projects/ProjectsOverlay'));
const AbilitiesOverlay = lazy(() => import('../../../features/portfolio/abilities/AbilitiesOverlay'));
const ContactOverlay = lazy(() => import('../../../features/portfolio/contact/ContactOverlay'));

interface StaticPortfolioProps {
  onSwitchToInteractive: () => void;
}

const HERO_ICON_SRC: Record<ContactIconId, string> = {
  linkedin: '/icons/contact/linkedin.png',
  github: '/icons/contact/github.png',
  email: '/icons/contact/email.png'
};

function HeroContactLinks() {
  const { contact } = PORTFOLIO_DATA;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {contact.map((item) => (
        <li key={item.name}>
          <LinkButton
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            icon={<img src={HERO_ICON_SRC[item.icon]} alt="" className="h-5 w-5 object-contain" width={20} height={20} />}
          >
            {item.name}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}

function HobbiesSection() {
  const { hobbies } = PORTFOLIO_DATA;
  return (
    <SketchSection id="hobbies" title="Hobbies">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hobbies.map((hobby) => (
          <Card
            as="article"
            key={hobby.id}
            padding="md"
          >
            <h3 className="mb-2 text-lg font-bold text-[#1a1a1a]">{hobby.name}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{hobby.description}</p>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}

function OverlayFallback() {
  return (
    <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{TEXTS.common.loading}</p>
  );
}

export default function StaticPortfolio({ onSwitchToInteractive }: StaticPortfolioProps) {
  const { profile } = PORTFOLIO_DATA;
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="relative min-h-[100dvh] min-h-dvh w-full overflow-x-hidden bg-[#f4f1ea]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.05]" />

      {/* Mode switch link — sticky, top-right */}
      <Button
        variant="floating"
        size="sm"
        onClick={onSwitchToInteractive}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label="Switch to interactive portfolio"
      >
        <Gamepad2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Try interactive</span>
        <span className="sm:hidden">Interactive</span>
      </Button>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] sm:px-6 sm:pt-16">
        {/* Hero */}
        <header className="mb-12 flex flex-col items-center gap-4 text-center sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
            Portfolio — Static edition
          </p>
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-6xl">{profile.name}</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/70 sm:text-base">
            {profile.location}
          </p>
          <p className="mt-2 max-w-xl text-sm italic leading-relaxed text-[#1a1a1a]/80 sm:text-base">
            “{profile.about}”
          </p>
          <div className="mt-2">
            <HeroContactLinks />
          </div>
        </header>

        <div className="flex flex-col gap-14 sm:gap-20">
          <Suspense fallback={<OverlayFallback />}>
            <SketchSection id="about" title="About">
              <ProfileOverlay />
            </SketchSection>

            <SketchSection id="experience" title="Experience">
              <ExperienceOverlay />
            </SketchSection>

            <SketchSection id="projects" title="Projects">
              <ProjectsOverlay />
            </SketchSection>

            <SketchSection id="abilities" title="Abilities">
              <AbilitiesOverlay />
            </SketchSection>

            <HobbiesSection />

            <SketchSection id="contact" title="Contact">
              <ContactOverlay />
            </SketchSection>
          </Suspense>
        </div>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/30 pt-6 text-center text-xs text-[#1a1a1a]/60 sm:mt-24">
          <p>
            Prefer the playful version?{' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchToInteractive}
              className="p-0 text-xs"
            >
              Try interactive mode →
            </Button>
          </p>
          <p>© {year} {profile.name}</p>
        </footer>
      </main>
    </div>
  );
}
